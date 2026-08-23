import { spawn, SpawnOptions } from 'child_process'
import { pathExists } from '../helpers/linux'
import { ExternalEditorError, FoundEditor } from './shared'
import {
  expandTargetPathArgument,
  ICustomIntegration,
  parseCustomIntegrationArguments,
} from '../custom-integration'

async function launchEditor(
  editorPath: string,
  args: readonly string[],
  editorName: string,
  spawnAsDarwinApp: boolean
) {
  const exists = await pathExists(editorPath)
  const label = __DARWIN__ ? '设置' : '选项'
  if (!exists) {
    throw new ExternalEditorError(
      `在路径 '${editorPath}' 找不到 ${editorName} 的可执行文件。请打开 ${label} 并选择一个可用的编辑器。`,
      { openPreferences: true }
    )
  }

  return new Promise<void>((resolve, reject) => {
    const opts: SpawnOptions = {
      // Make sure the editor processes are detached from the Desktop app.
      // Otherwise, some editors (like Notepad++) will be killed when the
      // Desktop app is closed.
      detached: true,
      stdio: 'ignore',
    }

    function spawnChildProcess() {
      if (__FLATPAK__) {
        return spawn('flatpak-spawn', ['--host', editorPath, ...args], opts)
      } else if (spawnAsDarwinApp) {
        return spawn('open', ['-a', editorPath, ...args], opts)
      } else {
        return spawn(editorPath, args, opts)
      }
    }
    const child = spawnChildProcess()

    child.on('error', reject)
    child.on('spawn', resolve)
    child.unref() // Don't wait for editor to exit
  }).catch((e: unknown) => {
    log.error(
      `Error while launching ${editorName}`,
      e instanceof Error ? e : undefined
    )
    throw new ExternalEditorError(
      e && typeof e === 'object' && 'code' in e && e.code === 'EACCES'
        ? `Desktop Plus 没有启动 ${editorName} 的适当权限。请打开 ${label} 并尝试另一个编辑器。`
        : `尝试启动 ${editorName} 时出错。请打开 ${label} 并尝试另一个编辑器。`,
      { openPreferences: true }
    )
  })
}

async function launchExecutableAndReturnStdout(
  path: string,
  args: readonly string[]
) {
  const opts: SpawnOptions = {
    stdio: ['ignore', 'pipe', 'inherit'],
  }

  return new Promise<string>((resolve, reject) => {
    const child = spawn(path, args, opts)

    let stdout = ''
    child.stdout?.on('data', data => {
      stdout += data.toString()
    })

    child.on('error', reject)
    child.on('close', () => resolve(stdout))
  }).catch((e: unknown) => {
    log.error(`在启动 ${path} 时出错`, e instanceof Error ? e : undefined)
    throw new ExternalEditorError(
      `尝试启动 ${path} 时出错。请打开选项并尝试另一个编辑器。`,
      { openPreferences: true }
    )
  })
}

/**
 * Open a given file or folder in the desired external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param editor The external editor to launch.
 */
export const launchExternalEditor = (fullPath: string, editor: FoundEditor) =>
  launchEditor(editor.path, [fullPath], `'${editor.editor}'`, __DARWIN__)

/**
 * Open a given file or folder in the desired custom external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param customEditor The external editor to launch.
 */
export const launchCustomExternalEditor = (
  fullPath: string,
  customEditor: ICustomIntegration
) => {
  const argv = parseCustomIntegrationArguments(customEditor.arguments)

  // Replace instances of RepoPathArgument with fullPath in customEditor.arguments
  const args = expandTargetPathArgument(argv, fullPath)

  // In macOS we can use `open` if it's an app (i.e. if we have a bundleID),
  // which will open the right executable file for us, we only need the path
  // to the editor .app folder.
  const spawnAsDarwinApp = __DARWIN__ && customEditor.bundleID !== undefined
  const editorName = `custom editor at path '${customEditor.path}'`

  return launchEditor(customEditor.path, args, editorName, spawnAsDarwinApp)
}

export async function launchAndReturnStdout(
  fullPath: string,
  executable: ICustomIntegration
): Promise<string> {
  const argv = parseCustomIntegrationArguments(executable.arguments)
  const args = expandTargetPathArgument(argv, fullPath)

  return launchExecutableAndReturnStdout(executable.path, args)
}
