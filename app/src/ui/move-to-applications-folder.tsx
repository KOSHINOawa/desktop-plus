import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from './dialog'
import { Dispatcher } from './dispatcher'
import { Checkbox, CheckboxValue } from './lib/checkbox'

interface IMoveToApplicationsFolderProps {
  readonly dispatcher: Dispatcher

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

interface IMoveToApplicationsFolderState {
  readonly askToMoveToApplicationsFolder: boolean
}

export class MoveToApplicationsFolder extends React.Component<
  IMoveToApplicationsFolderProps,
  IMoveToApplicationsFolderState
> {
  public constructor(props: IMoveToApplicationsFolderProps) {
    super(props)
    this.state = {
      askToMoveToApplicationsFolder: true,
    }
  }

  public render() {
    return (
      <Dialog
        title="将 Desktop Plus 移动到“应用程序”文件夹？"
        id="move-to-applications-folder"
        backdropDismissable={false}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="warning"
      >
        <DialogContent>
          <p>
            我们检测到 Desktop Plus
            并非从你计算机上的“应用程序”文件夹中运行。这可能会导致应用出现问题，包括影响你登录的能力。
          </p>
          <p>
            是否要立即将 Desktop Plus 移动到“应用程序”文件夹？这还将重启应用。
          </p>
          <div>
            <Checkbox
              label="不再显示此消息"
              value={
                this.state.askToMoveToApplicationsFolder
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskToMoveToApplicationsFolderChanged}
            />
          </div>
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText="移动并重启"
          okButtonTitle="这会将 Desktop Plus 移动到你计算机上的“应用程序”文件夹并重启应用。"
          cancelButtonText="暂不"
          onCancelButtonClick={this.onNotNow}
        />
      </DialogFooter>
    )
  }

  private onAskToMoveToApplicationsFolderChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askToMoveToApplicationsFolder: value })
  }

  private onNotNow = () => {
    this.props.onDismissed()
    this.props.dispatcher.setAskToMoveToApplicationsFolderSetting(
      this.state.askToMoveToApplicationsFolder
    )
  }

  private onSubmit = async () => {
    this.props.onDismissed()

    try {
      await this.props.dispatcher.moveToApplicationsFolder()
    } catch (error) {
      this.props.dispatcher.postError(error)
    }
  }
}
