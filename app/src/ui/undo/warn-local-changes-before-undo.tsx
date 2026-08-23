import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'

interface IWarnLocalChangesBeforeUndoProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly commit: Commit
  readonly isWorkingDirectoryClean: boolean
  readonly confirmUndoCommit: boolean
  readonly onDismissed: () => void
}

interface IWarnLocalChangesBeforeUndoState {
  readonly isLoading: boolean
  readonly confirmUndoCommit: boolean
}

/**
 * Dialog that alerts user that there are uncommitted changes in the working
 * directory where they are gonna be undoing a commit.
 */
export class WarnLocalChangesBeforeUndo extends React.Component<
  IWarnLocalChangesBeforeUndoProps,
  IWarnLocalChangesBeforeUndoState
> {
  public constructor(props: IWarnLocalChangesBeforeUndoProps) {
    super(props)
    this.state = {
      isLoading: false,
      confirmUndoCommit: props.confirmUndoCommit,
    }
  }

  public render() {
    const title = __DARWIN__ ? '撤销提交' : '撤销提交'

    return (
      <Dialog
        id="warn-local-changes-before-undo"
        type="warning"
        title={title}
        loading={this.state.isLoading}
        disabled={this.state.isLoading}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="undo-warning-message"
      >
        {this.getWarningDialog()}
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="继续" />
        </DialogFooter>
      </Dialog>
    )
  }

  private getWarningDialog() {
    if (this.props.commit.isMergeCommit) {
      return this.getMergeCommitWarningDialog()
    }
    return (
      <DialogContent>
        <Row id="undo-warning-message">
          你有正在进行的更改。撤销提交可能会导致其中部分更改丢失。无论如何都要继续吗？
        </Row>
        <Row>
          <Checkbox
              label="不再显示此消息"
            value={
              this.state.confirmUndoCommit
                ? CheckboxValue.Off
                : CheckboxValue.On
            }
            onChange={this.onConfirmUndoCommitChanged}
          />
        </Row>
      </DialogContent>
    )
  }

  private getMergeCommitWarningDialog() {
    if (this.props.isWorkingDirectoryClean) {
      return (
        <DialogContent>
          <p>{this.getMergeCommitUndoWarningText()}</p>
          <p>无论如何都要继续吗？</p>
        </DialogContent>
      )
    }
    return (
      <DialogContent>
        <p>
          你有正在进行的更改。撤销合并提交可能会导致其中部分更改丢失。
        </p>
        <p>{this.getMergeCommitUndoWarningText()}</p>
        <p>Do you want to continue anyway?</p>
      </DialogContent>
    )
  }

  private getMergeCommitUndoWarningText() {
    return `撤销合并提交会将合并中的更改应用到你的工作目录，
    再次提交将创建一个全新的提交。这意味着你将失去合并提交，
    因此被合并分支的提交可能会从这个分支上消失。`
  }

  private onSubmit = async () => {
    const { dispatcher, repository, commit, onDismissed } = this.props
    this.setState({ isLoading: true })

    try {
      dispatcher.setConfirmUndoCommitSetting(this.state.confirmUndoCommit)
      await dispatcher.undoCommit(repository, commit, false)
    } finally {
      this.setState({ isLoading: false })
    }

    onDismissed()
  }

  private onConfirmUndoCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ confirmUndoCommit: value })
  }
}
