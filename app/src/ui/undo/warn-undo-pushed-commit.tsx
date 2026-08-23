import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'

interface IWarnUndoPushedCommitProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly commit: Commit
  readonly onDismissed: () => void
}

interface IWarnUndoPushedCommitState {
  readonly isLoading: boolean
}

/**
 * Dialog that warns user that they are about to undo a commit that has already
 * been pushed to the remote repository.
 */
export class WarnUndoPushedCommit extends React.Component<
  IWarnUndoPushedCommitProps,
  IWarnUndoPushedCommitState
> {
  public constructor(props: IWarnUndoPushedCommitProps) {
    super(props)
    this.state = {
      isLoading: false,
    }
  }

  public render() {
    const title = __DARWIN__ ? '撤销已推送的提交？' : '撤销已推送的提交？'

    return (
      <Dialog
        id="warn-undo-pushed-commit"
        type="warning"
        title={title}
        loading={this.state.isLoading}
        disabled={this.state.isLoading}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="undo-pushed-commit-warning-message"
      >
        <DialogContent>
          <p id="undo-pushed-commit-warning-message">
            此提交已经推送到远程仓库。撤销它将重写你的本地历史记录。
          </p>
          <p>
            如果其他人已经拉取了此提交，他们在推送或拉取时可能会遇到问题。
            你将需要强制推送以更新远程仓库。
          </p>
          <p> 确定要继续吗？</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="撤销提交" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    const { dispatcher, repository, commit, onDismissed } = this.props
    this.setState({ isLoading: true })

    try {
      await dispatcher.undoCommit(repository, commit, false)
    } finally {
      this.setState({ isLoading: false })
    }

    onDismissed()
  }
}
