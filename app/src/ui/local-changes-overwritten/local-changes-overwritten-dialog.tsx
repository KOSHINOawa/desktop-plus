import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DefaultDialogFooter,
} from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Repository } from '../../models/repository'
import { RetryAction, RetryActionType } from '../../models/retry-actions'
import { Dispatcher } from '../dispatcher'
import { PathText } from '../lib/path-text'
import { assertNever } from '../../lib/fatal-error'

interface ILocalChangesOverwrittenDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  /**
   * Whether there's already a stash entry for the local branch.
   */
  readonly hasExistingStash: boolean
  /**
   * The action that should get executed if the user selects "Stash and Continue".
   */
  readonly retryAction: RetryAction
  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void

  /**
   * The files that prevented the operation from completing, i.e. the files
   * that would be overwritten.
   */
  readonly files: ReadonlyArray<string>
}
interface ILocalChangesOverwrittenDialogState {
  readonly stashing: boolean
}

export class LocalChangesOverwrittenDialog extends React.Component<
  ILocalChangesOverwrittenDialogProps,
  ILocalChangesOverwrittenDialogState
> {
  public constructor(props: ILocalChangesOverwrittenDialogProps) {
    super(props)
    this.state = { stashing: false }
  }

  public render() {
    const overwrittenText =
      this.props.files.length > 0
      ? ' 以下文件将被覆盖：'
      : null

    return (
      <Dialog
        title="错误"
        id="local-changes-overwritten"
        loading={this.state.stashing}
        disabled={this.state.stashing}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="error"
        role="alertdialog"
        ariaDescribedBy="local-changes-error-description"
      >
        <DialogContent>
          <div id="local-changes-error-description">
            <p>
              当你的分支上存在更改时，无法 {this.getRetryActionName()}。{overwrittenText}
            </p>
            {this.renderFiles()}
            {this.renderStashText()}
          </div>
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFiles() {
    const { files } = this.props
    if (files.length === 0) {
      return null
    }

    return (
      <div className="files-list">
        <ul>
          {files.map(fileName => (
            <li key={fileName}>
              <PathText path={fileName} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  private get canStashChanges() {
    return (
      !this.props.hasExistingStash &&
      !this.state.stashing &&
      this.props.retryAction.type !== RetryActionType.PopStash
    )
  }

  private renderStashText() {
    if (!this.canStashChanges) {
      return null
    }

    return <p>你可以现在暂存更改，之后再恢复它们。</p>
  }

  private renderFooter() {
    if (!this.canStashChanges) {
      return <DefaultDialogFooter />
    }

    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={
            __DARWIN__ ? '暂存更改并继续' : '暂存更改并继续'
          }
          okButtonTitle="这将使用你当前的更改创建一个暂存。你可以通过之后恢复暂存来取回它们。"
          cancelButtonText="关闭"
        />
      </DialogFooter>
    )
  }

  private onSubmit = async () => {
    const { repository, dispatcher, retryAction } = this.props

    if (!this.canStashChanges) {
      // When there's an existing stash we don't let the user stash the changes
      // and we only show a "Close" button on the modal. In that case, the
      // "Close" button submits the dialog and should only dismiss it.
      this.props.onDismissed()
      return
    }

    this.setState({ stashing: true })

    // We know that there's no stash for the current branch so we can safely
    // tell createStashForCurrentBranch not to show a confirmation dialog which
    // would disrupt the async flow (since you can't await a dialog).
    const createdStash = await dispatcher.createStashForCurrentBranch(
      repository
    )

    this.props.onDismissed()

    if (createdStash) {
      await dispatcher.performRetry(retryAction)
    }
  }

  /**
   * Returns a user-friendly string to describe the current retryAction.
   */
  private getRetryActionName() {
    switch (this.props.retryAction.type) {
      case RetryActionType.Checkout:
        return '检出'
      case RetryActionType.Pull:
        return '拉取'
      case RetryActionType.Merge:
        return '合并'
      case RetryActionType.Rebase:
        return '变基'
      case RetryActionType.Clone:
        return '克隆'
      case RetryActionType.Fetch:
        return '抓取'
      case RetryActionType.Push:
        return '推送'
      case RetryActionType.CherryPick:
      case RetryActionType.CreateBranchForCherryPick:
        return '挑拣'
      case RetryActionType.Squash:
        return '压缩'
      case RetryActionType.Reorder:
        return '重新排序'
      case RetryActionType.DiscardChanges:
        return '丢弃更改'
      case RetryActionType.StashChanges:
        return '暂存更改'
      case RetryActionType.ResetAndPull:
        return '重置并拉取'
      case RetryActionType.PopStash:
        return '恢复暂存的更改'
      default:
        assertNever(
          this.props.retryAction,
          `Unknown retryAction: ${this.props.retryAction}`
        )
    }
  }
}
