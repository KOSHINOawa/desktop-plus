import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IAddSSHHostProps {
  readonly host: string
  readonly ip: string
  readonly keyType: string
  readonly fingerprint: string
  readonly onSubmit: (addHost: boolean) => void
  readonly onDismissed: () => void
}

/**
 * Dialog prompts the user to add a new SSH host as known.
 */
export class AddSSHHost extends React.Component<IAddSSHHostProps> {
  public render() {
    return (
      <Dialog
        id="add-ssh-host"
        type="normal"
        title="SSH 主机"
        backdropDismissable={false}
        onSubmit={this.onSubmit}
        onDismissed={this.onCancel}
      >
        <DialogContent>
          <p>
            无法确认主机 '{this.props.host} ({this.props.ip})'
            的真实性。{this.props.keyType} 密钥指纹为{' '}
            {this.props.fingerprint}。
          </p>
          <p>确定要继续保持连接吗？</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="是"
            cancelButtonText="否"
            onCancelButtonClick={this.onCancel}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private submit(addHost: boolean) {
    const { onSubmit, onDismissed } = this.props

    onSubmit(addHost)
    onDismissed()
  }

  private onSubmit = () => {
    this.submit(true)
  }

  private onCancel = () => {
    this.submit(false)
  }
}
