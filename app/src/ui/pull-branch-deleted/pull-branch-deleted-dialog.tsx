import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Ref } from '../lib/ref'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'

interface IPullBranchDeletedDialogProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  /** The name of the branch whose remote branch no longer exists. */
  readonly branchName: string
  readonly onDismissed: () => void
}

interface IPullBranchDeletedDialogState {
  /** Whether to also delete the stale local branch we're switching away from. */
  readonly deleteStaleBranch: boolean
}

/**
 * Shown when pulling a repository fails because the current branch's remote
 * branch no longer exists (e.g. it was deleted or renamed on the remote).
 *
 * Offers to switch the repository to its default branch and retry the pull,
 * which is especially useful for the "Pull all" action where handling each
 * affected repository manually is tedious.
 */
export class PullBranchDeletedDialog extends React.Component<
  IPullBranchDeletedDialogProps,
  IPullBranchDeletedDialogState
> {
  public constructor(props: IPullBranchDeletedDialogProps) {
    super(props)
    this.state = { deleteStaleBranch: false }
  }

  public render() {
    return (
      <Dialog
        id="pull-branch-deleted"
        title={__DARWIN__ ? '无法拉取' : '无法拉取'}
        type="error"
        role="alertdialog"
        ariaDescribedBy="pull-branch-deleted-message"
        onSubmit={this.onSwitchToDefaultBranch}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <div id="pull-branch-deleted-message">
            <p>
              无法拉取 <Ref>{this.props.repository.name}</Ref>，因为{' '}
              <Ref>{this.props.branchName}</Ref> 的远程分支不存在。
            </p>
            <p>你可以将此仓库切换到其默认分支并再次拉取。</p>
          </div>

          <div className="pull-branch-deleted-dialog__delete-stale-branch">
            <Checkbox
              label={
                <>
                  同时删除分支 <Ref>{this.props.branchName}</Ref>
                </>
              }
              value={
                this.state.deleteStaleBranch
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onDeleteStaleBranchChange}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? '切换到默认分支' : '切换到默认分支'}
            okButtonTitle="这将检出仓库的默认分支并拉取它。"
            cancelButtonText="关闭"
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onDeleteStaleBranchChange = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.setState({ deleteStaleBranch: event.currentTarget.checked })
  }

  private onSwitchToDefaultBranch = () => {
    // Dismiss the dialog immediately and let the switch-and-pull run in the
    // background. Its progress is reported through the normal pull progress
    // indicator, and any failure surfaces through the standard error handler.
    this.props.onDismissed()
    this.props.dispatcher.switchToDefaultBranchAndPull(
      this.props.repository,
      this.state.deleteStaleBranch ? this.props.branchName : null
    )
  }
}
