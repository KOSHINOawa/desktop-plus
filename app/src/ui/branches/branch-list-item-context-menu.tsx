import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'
import { Branch, BranchType } from '../../models/branch'
import { GitHubRepository } from '../../models/github-repository'
import { getForgejoName } from '../../lib/forgejo-name'
import { assertNever } from '../../lib/fatal-error'

interface IBranchContextMenuConfig {
  branch: Branch
  gitHubRepository: GitHubRepository | null
  onRenameBranch?: (branchName: string) => void
  onViewBranchOnGitHub?: () => void
  onViewPullRequestOnGitHub?: () => void
  onSetAsDefaultBranch?: (branchName: string) => void
  onDeleteBranch?: (branchName: string) => void
  onDeleteUnusedLocalBranches?: () => void
  onPullSingleBranch?: (branchName: string) => void
  onCheckoutInNewWorktree?: (branch: Branch) => void
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const {
    branch,
    gitHubRepository,
    onRenameBranch,
    onViewBranchOnGitHub,
    onViewPullRequestOnGitHub,
    onSetAsDefaultBranch,
    onDeleteBranch,
    onDeleteUnusedLocalBranches,
    onPullSingleBranch,
    onCheckoutInNewWorktree,
  } = config
  const items = new Array<IMenuItem>()

  if (onRenameBranch !== undefined) {
    items.push({
      label: '重命名...',
      action: () => onRenameBranch(branch.name),
      enabled: branch.type === BranchType.Local,
    })
  }

  items.push({
    label: '复制分支名',
    action: () => clipboard.writeText(branch.name),
  })

  if (onViewBranchOnGitHub !== undefined && gitHubRepository !== null) {
    items.push({
      label: getViewBranchLabel(gitHubRepository),
      action: () => onViewBranchOnGitHub(),
    })
  }

  if (onViewPullRequestOnGitHub !== undefined && gitHubRepository !== null) {
    items.push({
      label: getViewPullRequestLabel(gitHubRepository),
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  if (onCheckoutInNewWorktree !== undefined) {
    items.push({
      label: '在新工作树中检出…',
      action: () => onCheckoutInNewWorktree(branch),
    })
  }

  if (onSetAsDefaultBranch !== undefined) {
    items.push({
      label: '作为默认分支',
      action: () => onSetAsDefaultBranch(branch.nameWithoutRemote),
    })
  }

  if (onPullSingleBranch) {
    items.push({ type: 'separator' })
    items.push({
      label: '拉取分支',
      action: () => onPullSingleBranch(branch.name),
      enabled: true,
    })
  }

  if (onDeleteBranch !== undefined) {
    items.push({ type: 'separator' })
    items.push({
      label: '删除…',
      action: () => onDeleteBranch(branch.name),
    })
  }

  if (onDeleteUnusedLocalBranches !== undefined) {
    items.push({
      label: '删除未使用的本地分支…',
      action: () => onDeleteUnusedLocalBranches(),
    })
  }

  return items
}

function getViewBranchLabel(gitHubRepository: GitHubRepository): string {
  const branch = __DARWIN__ ? '分支' : '分支'
  switch (gitHubRepository.type) {
    case 'github':
      return `在 Github 查看 ${branch}`
    case 'bitbucket':
      return `在 Bitbucket 查看 ${branch}`
    case 'gitlab':
      return `在 GitLab 查看 ${branch}`
    case 'forgejo':
      return `在 ${getForgejoName(gitHubRepository.endpoint)} 查看 ${branch}`
    case 'gitea':
      return `在 Gitea 查看 ${branch}`
    default:
      return assertNever(
        gitHubRepository.type,
        `未知仓库类型: ${gitHubRepository.type}`
      )
  }
}

function getViewPullRequestLabel(gitHubRepository: GitHubRepository): string {
  switch (gitHubRepository.type) {
    case 'github':
      return '在 Github 查看拉取请求'
    case 'bitbucket':
      return '在 Bitbucket 查看拉取请求'
    case 'gitlab':
      return '在 GitLab 查看合并请求'
    case 'forgejo':
      return `在 ${getForgejoName(gitHubRepository.endpoint)} 查看拉取请求`
    case 'gitea':
      return '在 Gitea 查看拉取请求'
    default:
      return assertNever(
        gitHubRepository.type,
        `未知仓库类型: ${gitHubRepository.type}`
      )
  }
}
