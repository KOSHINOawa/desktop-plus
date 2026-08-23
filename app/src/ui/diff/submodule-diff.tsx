import React from 'react'
import { parseRepositoryIdentifier } from '../../lib/remote-parsing'
import { ISubmoduleDiff } from '../../models/diff'
import { LinkButton } from '../lib/link-button'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { SuggestedAction } from '../suggested-actions'
import { Ref } from '../lib/ref'
import { CopyButton } from '../copy-button'
import { shortenSHA } from '../../models/commit'

type SubmoduleItemIcon =
  | {
      readonly octicon: typeof octicons.info
      readonly className: 'info-icon'
    }
  | {
      readonly octicon: typeof octicons.diffModified
      readonly className: 'modified-icon'
    }
  | {
      readonly octicon: typeof octicons.diffAdded
      readonly className: 'added-icon'
    }
  | {
      readonly octicon: typeof octicons.diffRemoved
      readonly className: 'removed-icon'
    }
  | {
      readonly octicon: typeof octicons.fileDiff
      readonly className: 'untracked-icon'
    }

interface ISubmoduleDiffProps {
  readonly onOpenSubmodule?: (fullPath: string) => void
  readonly diff: ISubmoduleDiff

  /**
   * Whether the diff is readonly, e.g., displaying a historical diff, or the
   * diff's content can be committed, e.g., displaying a change in the working
   * directory.
   */
  readonly readOnly: boolean
}

export class SubmoduleDiff extends React.Component<ISubmoduleDiffProps> {
  public constructor(props: ISubmoduleDiffProps) {
    super(props)
  }

  public render() {
    return (
      <div className="changes-interstitial submodule-diff">
        <div className="content">
          <div className="interstitial-header">
            <div className="text">
              <h1>子模块更改</h1>
            </div>
          </div>
          {this.renderSubmoduleInfo()}
          {this.renderCommitChangeInfo()}
          {this.renderSubmodulesChangesInfo()}
          {this.renderOpenSubmoduleAction()}
        </div>
      </div>
    )
  }

  private renderSubmoduleInfo() {
    if (this.props.diff.url === null) {
      return null
    }

    const repoIdentifier = parseRepositoryIdentifier(this.props.diff.url)
    if (repoIdentifier === null) {
      return null
    }

    const hostname =
      repoIdentifier.hostname === 'github.com'
        ? ''
        : ` (${repoIdentifier.hostname})`

    return this.renderSubmoduleDiffItem(
      { octicon: octicons.info, className: 'info-icon' },
      <>
        这是一个基于仓库{' '}
        <LinkButton
          uri={`https://${repoIdentifier.hostname}/${repoIdentifier.owner}/${repoIdentifier.name}`}
        >
          {repoIdentifier.owner}/{repoIdentifier.name}
          {hostname}
        </LinkButton>
        的子模块。
      </>
    )
  }

  private renderCommitChangeInfo() {
    const { diff, readOnly } = this.props
    const { oldSHA, newSHA } = diff

    const suffix = readOnly ? '' : ' 此更改可以提交到父仓库。'

    if (oldSHA !== null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: octicons.diffModified, className: 'modified-icon' },
        <>
          该子模块将其提交从 {this.renderCommitSHA(oldSHA, 'previous')} 更改为{' '}
          {this.renderCommitSHA(newSHA, 'new')}。{suffix}
        </>
      )
    } else if (oldSHA === null && newSHA !== null) {
      return this.renderSubmoduleDiffItem(
        { octicon: octicons.diffAdded, className: 'added-icon' },
        <>
          该子模块已添加，指向提交 {this.renderCommitSHA(newSHA)}。{suffix}
        </>
      )
    } else if (oldSHA !== null && newSHA === null) {
      return this.renderSubmoduleDiffItem(
        { octicon: octicons.diffRemoved, className: 'removed-icon' },
        <>
          该子模块已移除，当时它指向提交 {this.renderCommitSHA(oldSHA)}。
          {suffix}
        </>
      )
    }

    return null
  }

  private renderCommitSHA(sha: string, which?: 'previous' | 'new') {
    const whichLabel =
      which === undefined ? '' : which === 'previous' ? '先前' : '新'

    return (
      <>
        <Ref>{shortenSHA(sha)}</Ref>
        <CopyButton
          ariaLabel={
            whichLabel === '' ? '复制完整 SHA' : `复制完整${whichLabel}的 SHA`
          }
          copyContent={sha}
        />
      </>
    )
  }

  private renderSubmodulesChangesInfo() {
    const { diff } = this.props

    if (!diff.status.untrackedChanges && !diff.status.modifiedChanges) {
      return null
    }

    const changes =
      diff.status.untrackedChanges && diff.status.modifiedChanges
        ? '已修改且未跟踪'
        : diff.status.untrackedChanges
        ? '未跟踪'
        : '已修改'

    return this.renderSubmoduleDiffItem(
      { octicon: octicons.fileDiff, className: 'untracked-icon' },
      <>
        该子模块存在 {changes}{' '}
        更改。这些更改必须先在该子模块内提交，才能成为父仓库的一部分。
      </>
    )
  }

  private renderSubmoduleDiffItem(
    icon: SubmoduleItemIcon,
    content: React.ReactElement
  ) {
    return (
      <div className="item">
        <Octicon symbol={icon.octicon} className={icon.className} />
        <div className="content">{content}</div>
      </div>
    )
  }

  private renderOpenSubmoduleAction() {
    // If no url is found for the submodule, it means it can't be opened
    // This happens if the user is looking at an old commit which references
    // a submodule that got later deleted.
    if (this.props.diff.url === null) {
      return null
    }

    return (
      <span>
        <SuggestedAction
          title="在 Desktop Plus 中打开此子模块"
          description="你可以在 Desktop Plus 中像普通仓库一样打开此子模块，以管理并提交其中的任何更改。"
          buttonText={__DARWIN__ ? '打开仓库' : '打开仓库'}
          icon={octicons.repo}
          type="primary"
          onClick={this.onOpenSubmoduleClick}
        />
      </span>
    )
  }

  private onOpenSubmoduleClick = () => {
    this.props.onOpenSubmodule?.(this.props.diff.fullPath)
  }
}
