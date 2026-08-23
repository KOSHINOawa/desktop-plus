import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../../dialog'
import { OkCancelButtonGroup } from '../../dialog/ok-cancel-button-group'

interface ICopilotConflictResolutionAlwaysNudgeProps {
  readonly onAlwaysUseCopilot: () => void
  readonly onDecline: () => void
  readonly onDismissed: () => void
}

/**
 * Dialog nudging the user to enable the "Always use Copilot when conflicts are
 * detected" setting after they've used Copilot conflict resolution multiple
 * times in a row.
 */
export class CopilotConflictResolutionAlwaysNudge extends React.Component<ICopilotConflictResolutionAlwaysNudgeProps> {
  private onYes = () => {
    this.props.onAlwaysUseCopilot()
  }

  private onNo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    this.props.onDecline()
  }

  public render() {
    return (
      <Dialog
        id="copilot-conflict-resolution-always-nudge"
        title={
          __DARWIN__
            ? '始终使用 Copilot 解决冲突？'
            : '始终使用 Copilot 解决冲突？'
        }
        onSubmit={this.onYes}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            你是否希望在检测到冲突时自动使用 Copilot 开始？你可以随时在{' '}
            {__DARWIN__ ? '设置 → Copilot' : '文件 → 选项 → Copilot'} 中更改此设置。
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="是"
            cancelButtonText="否"
            onCancelButtonClick={this.onNo}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
