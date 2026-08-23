import {
  exec,
  GitError as DugiteError,
  parseError,
  IGitResult as DugiteResult,
  IGitExecutionOptions as DugiteExecutionOptions,
  parseBadConfigValueErrorInfo,
  ExecError,
} from 'dugite'

import { assertNever } from '../fatal-error'
import * as GitPerf from '../../ui/lib/git-perf'
import * as Path from 'path'
import { isErrnoException } from '../errno-exception'
import { withTrampolineEnv } from '../trampoline/trampoline-environment'
import { kStringMaxLength } from 'buffer'
import { withHooksEnv } from '../hooks/with-hooks-env'
import { coerceToString } from './coerce-to-string'
import { pushTerminalChunk } from './push-terminal-chunk'

export const isMaxBufferExceededError = (
  error: unknown
): error is ExecError & { code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' } => {
  return (
    error instanceof ExecError &&
    error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
  )
}

export type TerminalOutput = string | Buffer | Buffer[]

export type TerminalOutputListener = (cb: (chunk: TerminalOutput) => void) => {
  unsubscribe: () => void
}

export type TerminalOutputCallback = (subscribe: TerminalOutputListener) => void

export type HookProgress = {
  readonly hookName: string
} & (
  | {
      readonly status: 'started'
      readonly abort: () => void
    }
  | {
      readonly status: 'finished' | 'failed'
    }
)

export type HookCallbackOptions = {
  readonly onHookProgress?: (progress: HookProgress) => void
  readonly onHookFailure?: (
    hookName: string,
    terminalOutput: TerminalOutput
  ) => Promise<'abort' | 'ignore'>
  readonly onTerminalOutputAvailable?: TerminalOutputCallback
}

/**
 * An extension of the execution options in dugite that
 * allows us to piggy-back our own configuration options in the
 * same object.
 */
export interface IGitExecutionOptions
  extends HookCallbackOptions,
    DugiteExecutionOptions {
  /**
   * The exit codes which indicate success to the
   * caller. Unexpected exit codes will be logged and an
   * error thrown. Defaults to 0 if undefined.
   */
  readonly successExitCodes?: ReadonlySet<number>

  /**
   * The git errors which are expected by the caller. Unexpected errors will
   * be logged and an error thrown.
   */
  readonly expectedErrors?: ReadonlySet<DugiteError>

  /** Should it track & report LFS progress? */
  readonly trackLFSProgress?: boolean

  /**
   * Whether the command about to run is part of a background task or not.
   * This affects error handling and UI such as credential prompts.
   */
  readonly isBackgroundTask?: boolean

  readonly interceptHooks?: string[]
}

/**
 * The result of using `git`. This wraps dugite's results to provide
 * the parsed error if one occurs.
 */
export interface IGitResult extends DugiteResult {
  /**
   * The parsed git error. This will be null when the exit code is included in
   * the `successExitCodes`, or when dugite was unable to parse the
   * error.
   */
  readonly gitError: DugiteError | null

  /** The human-readable error description, based on `gitError`. */
  readonly gitErrorDescription: string | null

  /**
   * The path that the Git command was executed from, i.e. the
   * process working directory (not to be confused with the Git
   * working directory which is... super confusing, I know)
   */
  readonly path: string
}

/** The result of shelling out to git using a string encoding (default) */
export interface IGitStringResult extends IGitResult {
  /** The standard output from git. */
  readonly stdout: string

  /** The standard error output from git. */
  readonly stderr: string
}

export interface IGitStringExecutionOptions extends IGitExecutionOptions {
  readonly encoding?: BufferEncoding
}

export interface IGitBufferExecutionOptions extends IGitExecutionOptions {
  readonly encoding: 'buffer'
}

/** The result of shelling out to git using a buffer encoding */
export interface IGitBufferResult extends IGitResult {
  /** The standard output from git. */
  readonly stdout: Buffer

  /** The standard error output from git. */
  readonly stderr: Buffer
}

export class GitError extends Error {
  /** The result from the failed command. */
  public readonly result: IGitResult

  /** The args for the failed command. */
  public readonly args: ReadonlyArray<string>

  /**
   * Whether or not the error message is just the raw output of the git command.
   */
  public readonly isRawMessage: boolean

  public constructor(
    result: IGitResult,
    args: ReadonlyArray<string>,
    terminalOutput: string
  ) {
    let rawMessage = true
    let message

    if (result.gitErrorDescription) {
      message = `${result.path}: ${result.gitErrorDescription}`
      rawMessage = false
    } else if (terminalOutput.length > 0) {
      message = terminalOutput
    } else if (result.stderr.length) {
      message = coerceToString(result.stderr)
    } else if (result.stdout.length) {
      message = coerceToString(result.stdout)
    } else {
      message = `Unknown error (exit code ${result.exitCode})`
      rawMessage = false
    }

    super(message)

    this.name = 'GitError'
    this.result = result
    this.args = args
    this.isRawMessage = rawMessage
  }
}

export const isGitError = (
  e: unknown,
  parsedError?: DugiteError
): e is GitError => {
  return (
    e instanceof GitError &&
    (parsedError === undefined || e.result.gitError === parsedError)
  )
}

/**
 * Shell out to git with the given arguments, at the given path.
 *
 * @param args             The arguments to pass to `git`.
 *
 * @param path             The working directory path for the execution of the
 *                         command.
 *
 * @param name             The name for the command based on its caller's
 *                         context. This will be used for performance
 *                         measurements and debugging.
 *
 * @param options          Configuration options for the execution of git,
 *                         see IGitExecutionOptions for more information.
 *
 * Returns the result. If the command exits with a code not in
 * `successExitCodes` or an error not in `expectedErrors`, a `GitError` will be
 * thrown.
 */
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: IGitStringExecutionOptions
): Promise<IGitStringResult>
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: IGitBufferExecutionOptions
): Promise<IGitBufferResult>
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: IGitExecutionOptions
): Promise<IGitResult> {
  const defaultOptions: IGitExecutionOptions = {
    successExitCodes: new Set([0]),
    expectedErrors: new Set(),
    maxBuffer: options?.encoding === 'buffer' ? Infinity : kStringMaxLength,
  }

  const opts = { ...defaultOptions, ...options }

  // The combined contents of stdout and stderr with some light processing
  // applied to remove redundant lines caused by Git's use of `\r` to "erase"
  // the current line while writing progress output. See createTerminalOutput.
  //
  // Note: The output is capped at a maximum of 256kb and the sole intent of
  // this property is to provide "terminal-like" output to the user when a Git
  // command fails.
  const terminalChunks: string[] = []
  const terminalCapacity = 256 * 1024

  // Keep at most 256kb of combined stderr and stdout output. This is used
  // to provide more context in error messages.
  opts.processCallback = process => {
    options?.onTerminalOutputAvailable?.(function (cb) {
      terminalChunks.forEach(chunk => cb(chunk))

      process.stdout?.on('data', cb)
      process.stderr?.on('data', cb)

      return {
        unsubscribe: () => {
          process.stdout?.off('data', cb)
          process.stderr?.off('data', cb)
        },
      }
    })

    const push = (chunk: Buffer | string) => {
      pushTerminalChunk(terminalChunks, terminalCapacity, chunk)
    }

    process.stdout?.on('data', push)
    process.stderr?.on('data', push)

    options?.processCallback?.(process)
  }

  return withHooksEnv(
    hooksEnv =>
      withTrampolineEnv(
        async env => {
          const commandName = `${name}: git ${args.join(' ')}`

          const result = await GitPerf.measure(commandName, () =>
            exec(args, path, {
              ...opts,
              env: {
                // Explicitly set TERM to 'dumb' so that if Desktop was launched
                // from a terminal or if the system environment variables
                // have TERM set Git won't consider us as a smart terminal.
                // See https://github.com/git/git/blob/a7312d1a2/editor.c#L11-L15
                TERM: 'dumb',
                ...opts.env,
                ...hooksEnv,
                ...env,
              },
            })
          ).catch(err => {
            // If this is an exception thrown by Node.js (as opposed to
            // dugite) let's keep the salient details but include the name of
            // the operation.
            if (isErrnoException(err)) {
              throw new Error(`Failed to execute ${name}: ${err.code}`)
            }

            if (isMaxBufferExceededError(err)) {
              throw new ExecError(
                `${err.message} for ${name}`,
                err.stdout,
                err.stderr,
                // Dugite stores the original Node error in the cause property, by
                // passing that along we ensure that all we're doing here is
                // changing the error message (and capping the stack but that's
                // okay since we know exactly where this error is coming from).
                // The null coalescing here is a safety net in case dugite's
                // behavior changes from underneath us.
                err.cause ?? err
              )
            }

            throw err
          })

          const exitCode = result.exitCode

          let gitError: DugiteError | null = null
          const acceptableExitCode = opts.successExitCodes
            ? opts.successExitCodes.has(exitCode)
            : false
          if (!acceptableExitCode) {
            gitError = parseError(coerceToString(result.stderr))
            if (gitError === null) {
              gitError = parseError(coerceToString(result.stdout))
            }
          }

          const gitErrorDescription =
            gitError !== null
              ? getDescriptionForError(gitError, coerceToString(result.stderr))
              : null
          const gitResult = {
            ...result,
            gitError,
            gitErrorDescription,
            path,
          }

          let acceptableError = true
          if (gitError !== null && opts.expectedErrors) {
            acceptableError = opts.expectedErrors.has(gitError)
          }

          if ((gitError !== null && acceptableError) || acceptableExitCode) {
            return gitResult
          }

          // The caller should either handle this error, or expect that exit code.
          const errorMessage = new Array<string>()
          errorMessage.push(
            `\`git ${args.join(
              ' '
            )}\` exited with an unexpected code: ${exitCode}.`
          )

          const terminalOutput = terminalChunks.join('')

          if (terminalOutput.length > 0) {
            // Leave even less of the combined output in the log
            errorMessage.push(terminalOutput.slice(-1024))
          }

          if (gitError !== null) {
            errorMessage.push(
              `(The error was parsed as ${gitError}: ${gitErrorDescription})`
            )
          }

          log.error(errorMessage.join('\n'))

          throw new GitError(gitResult, args, terminalOutput)
        },
        path,
        options?.isBackgroundTask ?? false,
        hooksEnv
      ),
    path,
    options
  )
}

/**
 * Determine whether the provided `error` is an authentication failure
 * as per our definition. Note that this is not an exhaustive list of
 * authentication failures, only a collection of errors that we treat
 * equally in terms of error message and presentation to the user.
 */
export function isAuthFailureError(
  error: DugiteError
): error is
  | DugiteError.SSHAuthenticationFailed
  | DugiteError.SSHPermissionDenied
  | DugiteError.HTTPSAuthenticationFailed {
  switch (error) {
    case DugiteError.SSHAuthenticationFailed:
    case DugiteError.SSHPermissionDenied:
    case DugiteError.HTTPSAuthenticationFailed:
      return true
  }
  return false
}

/**
 * Determine whether the provided `error` is an error from Git indicating
 * that a configuration file  write failed due to a lock file already
 * existing for that config file.
 */
export function isConfigFileLockError(error: Error): error is GitError {
  return (
    error instanceof GitError &&
    error.result.gitError === DugiteError.ConfigLockFileAlreadyExists
  )
}

const lockFilePathRe = /^error: could not lock config file (.+?): File exists$/m

/**
 * If the `result` is associated with an config lock file error (as determined
 * by `isConfigFileLockError`) this method will attempt to extract an absolute
 * path (i.e. rooted) to the configuration lock file in question from the Git
 * output.
 */
export function parseConfigLockFilePathFromError(result: IGitResult) {
  const match = lockFilePathRe.exec(coerceToString(result.stderr))

  if (match === null) {
    return null
  }

  // Git on Windows may print the config file path using forward slashes.
  // Luckily for us forward slashes are not allowed in Windows file or
  // directory names so we can simply replace any instance of forward
  // slashes with backslashes.
  const normalized = __WIN32__ ? match[1].replace('/', '\\') : match[1]

  // https://github.com/git/git/blob/232378479/lockfile.h#L117-L119
  return Path.resolve(result.path, `${normalized}.lock`)
}

export function getDescriptionForError(
  error: DugiteError,
  stderr: string
): string | null {
  if (isAuthFailureError(error)) {
    const menuHint = __DARWIN__ ? 'Desktop Plus > Settings.' : 'File > Options.'
    return `Authentication failed. Some common reasons include:

- You are not logged in to your account: see ${menuHint}
- You may need to log out and log back in to refresh your token.
- You do not have permission to access this repository.
- The repository is archived on GitHub. Check the repository settings to confirm you are still permitted to push commits.
- If you use SSH authentication, check that your key is added to the ssh-agent and associated with your account.
- If you use SSH authentication, ensure the host key verification passes for your repository hosting service.
- If you used username / password authentication, you might need to use a Personal Access Token instead of your account password. Check the documentation of your repository hosting service.`
  }

  switch (error) {
    case DugiteError.BadConfigValue:
      const errorInfo = parseBadConfigValueErrorInfo(stderr)
      if (errorInfo === null) {
        return 'Unsupported git configuration value.'
      }

      return `git 配置项 '${errorInfo.key}' 的值 '${errorInfo.value}' 不受支持`
    case DugiteError.SSHKeyAuditUnverified:
      return 'SSH 密钥未经验证。'
    case DugiteError.RemoteDisconnection:
      return '远程连接已断开。请检查你的网络连接后重试。'
    case DugiteError.HostDown:
      return '主机已离线。请检查你的网络连接后重试。'
    case DugiteError.RebaseConflicts:
      return '在尝试变基时发现了一些冲突。请先解决冲突再继续。'
    case DugiteError.MergeConflicts:
      return '在尝试合并时发现了一些冲突。请先解决冲突并提交更改。'
    case DugiteError.HTTPSRepositoryNotFound:
    case DugiteError.SSHRepositoryNotFound:
      return '该仓库似乎已不存在。你可能没有访问权限，或者它已被删除或重命名。'
    case DugiteError.PushNotFastForward:
      return '自你上次拉取以来，仓库已更新。请先拉取再推送。'
    case DugiteError.BranchDeletionFailed:
      return '无法删除该分支。它可能已经被删除了。'
    case DugiteError.DefaultBranchDeletionFailed:
      return `该分支是仓库的默认分支，无法删除。`
    case DugiteError.RevertConflicts:
      return '要完成还原，请合并并提交更改。'
    case DugiteError.EmptyRebasePatch:
      return '没有剩余需要应用的更改了。'
    case DugiteError.NoMatchingRemoteBranch:
      return '没有与当前分支匹配的远程分支。'
    case DugiteError.NothingToCommit:
      return '没有可提交的更改。'
    case DugiteError.NoSubmoduleMapping:
      return '子模块已从 .gitmodules 中移除，但文件夹仍存在于仓库中。请删除该文件夹，提交更改，然后重试。'
    case DugiteError.SubmoduleRepositoryDoesNotExist:
      return '子模块指向一个不存在的位置。'
    case DugiteError.InvalidSubmoduleSHA:
      return '子模块指向一个不存在的提交。'
    case DugiteError.LocalPermissionDenied:
      return '权限被拒绝。'
    case DugiteError.InvalidMerge:
      return '这不是可以合并的内容。'
    case DugiteError.InvalidRebase:
      return '这不是可以变基的内容。'
    case DugiteError.NonFastForwardMergeIntoEmptyHead:
      return '你尝试的合并不是快进合并，因此无法在空分支上执行。'
    case DugiteError.PatchDoesNotApply:
      return '请求的更改与仓库中的一个或多个文件存在冲突。'
    case DugiteError.BranchAlreadyExists:
      return '已存在同名分支。'
    case DugiteError.BadRevision:
      return '无效的修订版本。'
    case DugiteError.NotAGitRepository:
      return '这不是一个 Git 仓库。'
    case DugiteError.ProtectedBranchForcePush:
      return '该分支受保护，禁止强制推送。'
    case DugiteError.ProtectedBranchRequiresReview:
      return '该分支受保护，任何更改都需要经过批准的审查。请改为创建一个面向该分支的拉取请求来提交更改。'
    case DugiteError.PushWithFileSizeExceedingLimit:
      return '推送操作包含的文件超出了 GitHub 100MB 的文件大小限制。请从历史记录中移除该文件后重试。'
    case DugiteError.HexBranchNameRejected:
      return '分支名称不能是由 40 个十六进制字符组成的字符串，因为那是 Git 表示对象所使用的格式。'
    case DugiteError.ForcePushRejected:
      return '当前分支的强制推送已被拒绝。'
    case DugiteError.InvalidRefLength:
      return '引用（ref）长度不能超过 255 个字符。'
    case DugiteError.CannotMergeUnrelatedHistories:
      return '无法合并此仓库中不相干的历史记录。'
    case DugiteError.PushWithPrivateEmail:
      return '无法推送这些提交，因为它们包含在 GitHub 上被标记为私有的电子邮件地址。若要继续推送，请访问 https://github.com/settings/emails，取消勾选“对我的电子邮件地址保密”，然后切回 Desktop Plus 以推送提交。之后你可以重新启用该设置。'
    case DugiteError.LFSAttributeDoesNotMatch:
      return '在全局 Git 配置中找到的 Git LFS 属性与预期值不匹配。'
    case DugiteError.ProtectedBranchDeleteRejected:
      return '该分支在远程仓库中被标记为受保护，因此无法删除。'
    case DugiteError.ProtectedBranchRequiredStatus:
      return '推送被远程服务器拒绝，因为尚未通过所需的状态检查。'
    case DugiteError.BranchRenameFailed:
      return '无法重命名该分支。'
    case DugiteError.PathDoesNotExist:
      return '该路径在磁盘上不存在。'
    case DugiteError.InvalidObjectName:
      return '在 Git 仓库中找不到该对象。'
    case DugiteError.OutsideRepository:
      return '该路径不是仓库内的有效路径。'
    case DugiteError.LockFileAlreadyExists:
      return '仓库中已存在锁文件，导致此操作无法完成。'
    case DugiteError.NoMergeToAbort:
      return '当前没有正在进行的合并，因此无需中止。'
    case DugiteError.NoExistingRemoteBranch:
      return '远程分支不存在。'
    case DugiteError.LocalChangesOverwritten:
      return '无法切换分支，因为工作目录中的更改会被覆盖。请提交或暂存你的更改。'
    case DugiteError.UnresolvedConflicts:
      return '工作目录中存在未解决的冲突。'
    case DugiteError.ConfigLockFileAlreadyExists:
      // Added in dugite 1.88.0 (https://github.com/desktop/dugite/pull/386)
      // in support of https://github.com/desktop/desktop/issues/8675 but we're
      // not using it yet. Returning a null message here means the stderr will
      // be used as the error message (or stdout if stderr is empty), i.e. the
      // same behavior as before the ConfigLockFileAlreadyExists was added
      return null
    case DugiteError.RemoteAlreadyExists:
      return null
    case DugiteError.TagAlreadyExists:
      return '已存在同名标签'
    case DugiteError.MergeWithLocalChanges:
    case DugiteError.RebaseWithLocalChanges:
    case DugiteError.GPGFailedToSignData:
    case DugiteError.ConflictModifyDeletedInBranch:
    case DugiteError.MergeCommitNoMainlineOption:
    case DugiteError.UnsafeDirectory:
    case DugiteError.PathExistsButNotInRef:
    case DugiteError.PushWithSecretDetected:
      return null
    default:
      return assertNever(error, `Unknown error: ${error}`)
  }
}

/**
 * Returns the arguments to use on any git operation that can end up
 * triggering a rebase.
 */
export function gitRebaseArguments() {
  return [
    // Explicitly set the rebase backend to merge.
    // We need to force this option to be sure that Desktop
    // uses the merge backend even if the user has the apply backend
    // configured, since this is the only one supported.
    // This can go away once git deprecates the apply backend.
    ...['-c', 'rebase.backend=merge'],
  ]
}

/**
 * Returns the SHA of the passed in IGitResult
 */
export function parseCommitSHA(result: IGitStringResult): string {
  return result.stdout.split(']')[0].split(' ')[1]
}
