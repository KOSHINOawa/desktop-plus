import { assertNever } from '../../lib/fatal-error'
import { IMenuItem } from '../../lib/menu-item'
import { GitHubRepository } from '../../models/github-repository'
import { getForgejoName } from '../../lib/forgejo-name'

interface IPullRequestContextMenuConfig {
  onViewPullRequestOnGitHub?: () => void
  onCheckoutInNewWorktree?: () => void
  gitHubRepository: GitHubRepository
}

export function generatePullRequestContextMenuItems(
  config: IPullRequestContextMenuConfig
): IMenuItem[] {
  const { onViewPullRequestOnGitHub, onCheckoutInNewWorktree } = config
  const items = new Array<IMenuItem>()

  if (onViewPullRequestOnGitHub !== undefined) {
    items.push({
      label: getViewPullRequestLabel(config.gitHubRepository),
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  if (onCheckoutInNewWorktree !== undefined) {
    items.push({
      label: '在新工作树中检出…',
      action: () => onCheckoutInNewWorktree(),
    })
  }

  return items
}

function getViewPullRequestLabel(gitHubRepository: GitHubRepository): string {
  switch (gitHubRepository.type) {
    case 'github':
      return '在 GitHub 上查看拉取请求'
    case 'bitbucket':
      return '在 Bitbucket 上查看拉取请求'
    case 'gitlab':
      return '在 GitLab 上查看合并请求'
    case 'forgejo':
      return `在 ${getForgejoName(gitHubRepository.endpoint)} 上查看拉取请求`
    case 'gitea':
      return '在 Gitea 上查看拉取请求'
    default:
      assertNever(
        gitHubRepository.type,
        `未知的仓库类型：${gitHubRepository.type}`
      )
  }
}
