import * as React from 'react'
import { DialogContent } from '../dialog'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { Row } from '../lib/row'
import { RadioGroup } from '../lib/radio-group'
import { LinkButton } from '../lib/link-button'
import { assertNever } from '../../lib/fatal-error'
import {
  IConfigValueOrigin,
  getOriginFilePath,
  formatConfigScope,
  formatConfigPath,
} from '../../lib/git/config'
import { showItemInFolder } from '../main-process-proxy'
import memoizeOne from 'memoize-one'
import { UpdateBranchStrategy } from '../../lib/update-branch-strategy'

interface IGitConfigProps {
  readonly account: Account | null

  readonly gitConfigLocation: GitConfigLocation
  readonly updateBranchStrategy: UpdateBranchStrategy
  readonly name: string
  readonly email: string
  readonly globalName: string
  readonly globalEmail: string
  readonly isLoadingGitConfig: boolean

  readonly nameOrigin?: IConfigValueOrigin | null
  readonly emailOrigin?: IConfigValueOrigin | null
  readonly repositoryPath: string

  readonly onGitConfigLocationChanged: (value: GitConfigLocation) => void
  readonly onUpdateBranchStrategyChanged: (value: UpdateBranchStrategy) => void
  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
}

export enum GitConfigLocation {
  Global = 'Global',
  Local = 'Local',
}

/** A view for creating or modifying the repository's gitignore file */
export class GitConfig extends React.Component<IGitConfigProps> {
  // To avoid recreating the accounts array on every render
  private getAccounts = memoizeOne((account: Account | null) =>
    account ? [account] : []
  )

  private onGitConfigLocationChanged = (value: GitConfigLocation) => {
    this.props.onGitConfigLocationChanged(value)
  }

  private onUpdateBranchStrategyChanged = (value: UpdateBranchStrategy) => {
    this.props.onUpdateBranchStrategyChanged(value)
  }

  private renderUpdateBranchStrategyLabel = (key: UpdateBranchStrategy) => {
    switch (key) {
      case UpdateBranchStrategy.Merge:
        return '将默认分支合并到当前分支'
      case UpdateBranchStrategy.Rebase:
        return '将当前分支变基到默认分支上'
      default:
        return assertNever(key, `Unknown update branch strategy: ${key}`)
    }
  }

  private renderConfigOptionLabel = (key: GitConfigLocation) => {
    switch (key) {
      case GitConfigLocation.Global:
        return '使用我的全局 Git 配置'
      case GitConfigLocation.Local:
        return '使用本地 Git 配置'
      default:
        return assertNever(key, `Unknown git config location: ${key}`)
    }
  }

  public render() {
    const configOptions = [GitConfigLocation.Global, GitConfigLocation.Local]
    const selectionOption =
      configOptions.find(o => o === this.props.gitConfigLocation) ??
      GitConfigLocation.Global

    return (
      <DialogContent className="git-config-tab">
        <div className="advanced-section update-branch-strategy">
          <h2 id="update-branch-strategy-heading">
            从默认分支更新时，我希望
          </h2>
          <Row>
            <RadioGroup<UpdateBranchStrategy>
              ariaLabelledBy="update-branch-strategy-heading"
              selectedKey={this.props.updateBranchStrategy}
              radioButtonKeys={[
                UpdateBranchStrategy.Merge,
                UpdateBranchStrategy.Rebase,
              ]}
              onSelectionChanged={this.onUpdateBranchStrategyChanged}
              renderRadioButtonLabelContents={
                this.renderUpdateBranchStrategyLabel
              }
            />
          </Row>
        </div>
        <div className="advanced-section">
          <h2 id="git-config-heading">对于此仓库，我希望</h2>
          <Row>
            <RadioGroup<GitConfigLocation>
              ariaLabelledBy="git-config-heading"
              selectedKey={selectionOption}
              radioButtonKeys={configOptions}
              onSelectionChanged={this.onGitConfigLocationChanged}
              renderRadioButtonLabelContents={this.renderConfigOptionLabel}
            />
          </Row>
          <GitConfigUserForm
            email={
              this.props.gitConfigLocation === GitConfigLocation.Global
                ? this.props.globalEmail
                : this.props.email
            }
            name={
              this.props.gitConfigLocation === GitConfigLocation.Global
                ? this.props.globalName
                : this.props.name
            }
            accounts={this.getAccounts(this.props.account)}
            disabled={this.props.gitConfigLocation === GitConfigLocation.Global}
            onEmailChanged={this.props.onEmailChanged}
            onNameChanged={this.props.onNameChanged}
            isLoadingGitConfig={this.props.isLoadingGitConfig}
          />
        </div>
        {this.renderConfigOrigin()}
      </DialogContent>
    )
  }

  private onRevealNameConfigFile = () => {
    if (this.props.nameOrigin) {
      showItemInFolder(
        getOriginFilePath(this.props.nameOrigin, this.props.repositoryPath)
      )
    }
  }

  private onRevealEmailConfigFile = () => {
    if (this.props.emailOrigin) {
      showItemInFolder(
        getOriginFilePath(this.props.emailOrigin, this.props.repositoryPath)
      )
    }
  }

  private renderOriginEntry(
    key: string,
    origin: IConfigValueOrigin,
    onReveal: () => void
  ) {
    const repoPath = this.props.repositoryPath
    return (
      <div className="config-origin-card">
        <div className="config-origin-key">
          {key} = {origin.value}
        </div>
        <div className="config-origin-detail">
          作用域：{formatConfigScope(origin)}
        </div>
        <div className="config-origin-detail">
          文件：{' '}
          <LinkButton onClick={onReveal}>
            {formatConfigPath(origin, repoPath)}
          </LinkButton>
        </div>
      </div>
    )
  }

  private renderConfigOrigin() {
    const { nameOrigin, emailOrigin } = this.props
    if (!nameOrigin && !emailOrigin) {
      return null
    }

    return (
      <div className="config-origin-hint">
        <h2>已解析的有效身份</h2>
        {nameOrigin &&
          this.renderOriginEntry(
            'user.name',
            nameOrigin,
            this.onRevealNameConfigFile
          )}
        {emailOrigin &&
          this.renderOriginEntry(
            'user.email',
            emailOrigin,
            this.onRevealEmailConfigFile
          )}
      </div>
    )
  }
}
