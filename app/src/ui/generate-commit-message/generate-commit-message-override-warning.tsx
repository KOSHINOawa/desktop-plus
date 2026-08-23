import * as React from 'react'
import { Repository } from '../../models/repository'
import { WorkingDirectoryFileChange } from '../../models/status'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import { Row } from '../lib/row'

interface IGenerateCommitMessageOverrideWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly filesSelected: ReadonlyArray<WorkingDirectoryFileChange>
  readonly showCopilotInstructionsTip: boolean

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

interface IGenerateCommitMessageOverrideWarningState {
  readonly confirmCommitMessageOverride: boolean
}

export class GenerateCommitMessageOverrideWarning extends React.Component<
  IGenerateCommitMessageOverrideWarningProps,
  IGenerateCommitMessageOverrideWarningState
> {
  public constructor(props: IGenerateCommitMessageOverrideWarningProps) {
    super(props)

    this.state = {
      confirmCommitMessageOverride: true,
    }
  }

  public render() {
    const ariaDescribedBy = this.props.showCopilotInstructionsTip
      ? 'generate-commit-message-override-warning-body generate-commit-message-override-warning-tip'
      : 'generate-commit-message-override-warning-body'

    return (
      <Dialog
        title="提交信息覆盖"
        id="generate-commit-message-override-warning"
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onOverride}
        ariaDescribedBy={ariaDescribedBy}
        role="alertdialog"
      >
        <DialogContent>
          <Row id="generate-commit-message-override-warning-body">
            您输入的提交信息将被生成的提交信息覆盖。
          </Row>
          {this.props.showCopilotInstructionsTip ? (
            <Row>
              <p id="generate-commit-message-override-warning-tip">
                提示：您可以使用{' '}
                <LinkButton uri="https://gh.io/desktop-copilot-custom-instructions">
                  Copilot Instructions
                </LinkButton>{' '}
                来自定义提交信息的生成方式。
              </p>
            </Row>
          ) : null}
          <Row>
            <Checkbox
              label="不再显示此消息"
              value={
                this.state.confirmCommitMessageOverride
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onConfirmCommitMessageOverrideChanged}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="覆盖" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmCommitMessageOverrideChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked
    this.setState({ confirmCommitMessageOverride: value })
  }

  private onOverride = async () => {
    if (!this.state.confirmCommitMessageOverride) {
      await this.props.dispatcher.setConfirmCommitMessageOverrideSetting(false)
    }

    this.props.dispatcher.generateCommitMessage(
      this.props.repository,
      this.props.filesSelected
    )
    this.props.onDismissed()
  }
}
