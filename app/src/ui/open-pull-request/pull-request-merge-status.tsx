import * as React from 'react'
import { assertNever } from '../../lib/fatal-error'
import { ComputedAction } from '../../models/computed-action'
import { MergeTreeResult } from '../../models/merge'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface IPullRequestMergeStatusProps {
  /** The result of merging the pull request branch into the base branch */
  readonly mergeStatus: MergeTreeResult | null
}

/** The component to display message about the result of merging the pull
 * request. */
export class PullRequestMergeStatus extends React.Component<IPullRequestMergeStatusProps> {
  private getMergeStatusDescription = () => {
    const { mergeStatus } = this.props
    if (mergeStatus === null) {
      return ''
    }

    const { kind } = mergeStatus
    switch (kind) {
      case ComputedAction.Loading:
        return (
          <span className="pr-merge-status-loading">
            <strong>正在检查可合并性&hellip;</strong>{' '}
            不用担心，你仍然可以创建拉取请求。
          </span>
        )
      case ComputedAction.Invalid:
        return (
          <span className="pr-merge-status-invalid">
            <strong>检查合并状态出错。</strong> 无法合并此仓库中不相关的历史记录
          </span>
        )
      case ComputedAction.Clean:
        return (
          <span className="pr-merge-status-clean">
            <strong>
              <Octicon symbol={octicons.check} /> 可以合并。
            </strong>{' '}
            这些分支可以自动合并。
          </span>
        )
      case ComputedAction.Conflicts:
        return (
          <span className="pr-merge-status-conflicts">
            <strong>
              <Octicon symbol={octicons.x} /> 无法自动合并。
            </strong>{' '}
            不用担心，你仍然可以创建拉取请求。
          </span>
        )
      default:
        return assertNever(kind, `Unknown merge status kind of ${kind}.`)
    }
  }

  public render() {
    return (
      <div className="pull-request-merge-status">
        {this.getMergeStatusDescription()}
      </div>
    )
  }
}
