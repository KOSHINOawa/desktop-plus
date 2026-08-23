import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IConfirmDeletePushedTagProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly tagName: string
  readonly onDismissed: () => void
}

interface IConfirmDeletePushedTagState {
  readonly isDeleting: boolean
}
/**
 * Dialog to confirm deleting an already pushed tag
 */
export class ConfirmDeletePushedTagDialog extends React.Component<
  IConfirmDeletePushedTagProps,
  IConfirmDeletePushedTagState
> {
  public constructor(props: IConfirmDeletePushedTagProps) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    const title = __DARWIN__ ? '删除已推送的标签？' : '删除已推送的标签？'

    return (
      <Dialog
        id="delete-pushed-tag"
        type="warning"
        title={title}
        loading={this.state.isDeleting}
        disabled={this.state.isDeleting}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        ariaDescribedBy="delete-pushed-tag-confirmation"
        role="alertdialog"
      >
        <DialogContent>
          <Row id="delete-pushed-tag-confirmation">
            此标签已经推送到远程。你确定要在本地删除它吗？
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="删除" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    const { dispatcher, repository, tagName, onDismissed } = this.props

    this.setState({
      isDeleting: true,
    })

    try {
      await dispatcher.deleteTag(repository, tagName)
    } finally {
      this.setState({
        isDeleting: false,
      })
    }

    onDismissed()
  }
}
