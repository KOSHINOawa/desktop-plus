import * as React from 'react'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { TrashNameLabel } from '../lib/context-menu'

interface IDeleteRepositoryGroupProps {
  readonly dispatcher: Dispatcher
  readonly groupName: string
  readonly repositories: ReadonlyArray<Repository>
  readonly onDismissed: () => void
}

interface IDeleteRepositoryGroupState {
  readonly removeRepositories: boolean
  readonly moveRepositoriesToTrash: boolean
  readonly isDeletingGroup: boolean
}

export class DeleteRepositoryGroup extends React.Component<
  IDeleteRepositoryGroupProps,
  IDeleteRepositoryGroupState
> {
  public constructor(props: IDeleteRepositoryGroupProps) {
    super(props)

    this.state = {
      removeRepositories: false,
      moveRepositoriesToTrash: false,
      isDeletingGroup: false,
    }
  }

  public render() {
    const { groupName, repositories } = this.props
    const count = repositories.length

    return (
      <Dialog
        id="delete-repository-group"
        key="delete-repository-group-confirmation"
        type="warning"
        title={__DARWIN__ ? '删除分组' : '删除分组'}
        dismissDisabled={this.state.isDeletingGroup}
        loading={this.state.isDeletingGroup}
        disabled={this.state.isDeletingGroup}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            你确定要删除分组 "{groupName}" 吗？这将取消它与 {count}{' '}
            个仓库的关联。
          </p>

          <div>
            <Checkbox
              label={
                __DARWIN__
                  ? `同时从 Desktop Plus 中移除这些仓库`
                  : `同时从 Desktop Plus 中移除这些仓库`
              }
              value={
                this.state.removeRepositories
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onRemoveRepositoriesChanged}
            />
            <Checkbox
              label={'同时将这些仓库移动到 ' + TrashNameLabel}
              value={
                this.state.moveRepositoriesToTrash
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onMoveRepositoriesToTrashChanged}
              disabled={!this.state.removeRepositories}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="删除" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onRemoveRepositoriesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.setState({
      removeRepositories: event.currentTarget.checked,
      moveRepositoriesToTrash: false,
    })
  }

  private onMoveRepositoriesToTrashChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.setState({ moveRepositoriesToTrash: event.currentTarget.checked })
  }

  private onSubmit = async () => {
    this.setState({ isDeletingGroup: true })

    const { dispatcher, repositories } = this.props

    if (this.state.removeRepositories) {
      await Promise.all(
        repositories.map(repository =>
          dispatcher.removeRepository(
            repository,
            this.state.moveRepositoriesToTrash
          )
        )
      )
    } else {
      await dispatcher.changeRepositoriesGroupName(repositories, null)
    }

    this.props.onDismissed()
  }
}
