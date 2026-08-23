import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Dispatcher } from '../dispatcher'
import { TrashNameLabel } from '../lib/context-menu'
import { RetryAction } from '../../models/retry-actions'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IDiscardChangesRetryDialogProps {
  readonly dispatcher: Dispatcher
  readonly retryAction: RetryAction
  readonly onDismissed: () => void
  readonly onConfirmDiscardChangesChanged: (optOut: boolean) => void
}

interface IDiscardChangesRetryDialogState {
  readonly retrying: boolean
  readonly confirmDiscardChanges: boolean
}

export class DiscardChangesRetryDialog extends React.Component<
  IDiscardChangesRetryDialogProps,
  IDiscardChangesRetryDialogState
> {
  public constructor(props: IDiscardChangesRetryDialogProps) {
    super(props)
    this.state = { retrying: false, confirmDiscardChanges: true }
  }

  public render() {
    const { retrying } = this.state

    return (
      <Dialog
        title={__DARWIN__ ? '丢弃的更改将无法恢复' : '丢弃的更改将无法恢复'}
        id="discard-changes-retry"
        loading={retrying}
        disabled={retrying}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="error"
      >
        <DialogContent>
          <p>无法将更改丢弃至 {TrashNameLabel}。</p>
          <div>
            常见原因有：
            <ul>
              <li>{TrashNameLabel} 已配置为立即删除项目。</li>
              <li>移动文件时访问受限。</li>
            </ul>
          </div>
          <p>这些更改将无法从 {TrashNameLabel} 中恢复。</p>
          {this.renderConfirmDiscardChanges()}
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderConfirmDiscardChanges() {
    return (
      <Checkbox
        label="不要再显示此消息"
        value={
          this.state.confirmDiscardChanges
            ? CheckboxValue.Off
            : CheckboxValue.On
        }
        onChange={this.onConfirmDiscardChangesChanged}
      />
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={__DARWIN__ ? '永久丢弃更改' : '永久丢弃更改'}
          okButtonTitle={`这将丢弃更改，且它们将无法恢复。`}
          cancelButtonText="取消"
          destructive={true}
        />
      </DialogFooter>
    )
  }

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
  }

  private onSubmit = async () => {
    const { dispatcher, retryAction } = this.props

    this.setState({ retrying: true })

    await dispatcher.performRetry(retryAction)

    this.props.onConfirmDiscardChangesChanged(this.state.confirmDiscardChanges)
    this.props.onDismissed()
  }
}
