import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { nameOf, Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'
import { assertNever } from '../../lib/fatal-error'
import { getForgejoName } from '../../lib/forgejo-name'

interface IChangeRepositoryAliasProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly repository: Repository
}

interface IChangeRepositoryAliasState {
  readonly newAlias: string
}

export class ChangeRepositoryAlias extends React.Component<
  IChangeRepositoryAliasProps,
  IChangeRepositoryAliasState
> {
  public constructor(props: IChangeRepositoryAliasProps) {
    super(props)

    this.state = { newAlias: props.repository.alias ?? props.repository.name }
  }

  public render() {
    const repository = this.props.repository
    const verb = repository.alias === null ? '创建' : '修改'

    return (
      <Dialog
        id="change-repository-alias"
        title={`${verb} 仓库别名`}
        ariaDescribedBy="change-repository-alias-description"
        onDismissed={this.props.onDismissed}
        onSubmit={this.changeAlias}
      >
        <DialogContent>
          <p id="change-repository-alias-description">
            为仓库 "{nameOf(repository)}" 选择一个新的别名。{' '}
          </p>
          <p>
            <TextBox
              ariaLabel="别名"
              value={this.state.newAlias}
              onValueChanged={this.onNameChanged}
            />
          </p>
          {repository.gitHubRepository !== null && (
            <p className="description">
              这不会影响原始仓库名称
              {this.remoteLabel(repository)}.
            </p>
          )}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={`${verb} 别名`}
            okButtonDisabled={this.state.newAlias.length === 0}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private remoteLabel(repository: Repository) {
    const { gitHubRepository } = repository
    if (gitHubRepository === null) {
      return ''
    }

    switch (gitHubRepository.type) {
      case 'github':
        return ' 在 GitHub'
      case 'bitbucket':
        return ' 在 Bitbucket'
      case 'gitlab':
        return ' 在 GitLab'
      case 'forgejo':
        return ` 在 ${getForgejoName(gitHubRepository.endpoint)}`
      case 'gitea':
        return ' 在 Gitea'
      default:
        assertNever(
          gitHubRepository.type,
          `未知仓库类型: ${gitHubRepository.type}`
        )
    }
  }

  private onNameChanged = (newAlias: string) => {
    this.setState({ newAlias })
  }

  private changeAlias = () => {
    this.props.dispatcher.changeRepositoryAlias(
      this.props.repository,
      this.state.newAlias
    )
    this.props.onDismissed()
  }
}
