import * as React from 'react'
import { DialogContent } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { TabBar } from '../tab-bar'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Select } from '../lib/select'
import {
  shellFriendlyNames,
  SupportedHooksEnvShell,
} from '../../lib/hooks/config'

interface IGitProps {
  readonly name: string
  readonly email: string
  readonly defaultBranch: string
  readonly isLoadingGitConfig: boolean

  readonly accounts: ReadonlyArray<Account>

  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
  readonly onDefaultBranchChanged: (defaultBranch: string) => void

  readonly onEditGlobalGitConfig: () => void

  readonly selectedTabIndex?: number
  readonly onSelectedTabIndexChanged: (index: number) => void

  readonly onEnableGitHookEnvChanged: (enableGitHookEnv: boolean) => void
  readonly onCacheGitHookEnvChanged: (cacheGitHookEnv: boolean) => void
  readonly onSelectedShellChanged: (selectedShell: string) => void

  readonly enableGitHookEnv: boolean
  readonly cacheGitHookEnv: boolean
  readonly selectedShell: string

  readonly showCommitAuthorInfo: boolean
  readonly onShowCommitAuthorInfoChanged: (show: boolean) => void

  readonly setGlobalAuthor: boolean
  readonly globalAuthorWasSet: boolean
  readonly onSetGlobalAuthorChanged: (value: boolean) => void
}

const windowsShells: ReadonlyArray<SupportedHooksEnvShell> = [
  'git-bash',
  'pwsh',
  'powershell',
  'cmd',
]

export class Git extends React.Component<IGitProps> {
  private get selectedTabIndex() {
    return this.props.selectedTabIndex ?? 0
  }

  private onTabClicked = (index: number) => {
    this.props.onSelectedTabIndexChanged?.(index)
  }

  private onEnableGitHookEnvChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onEnableGitHookEnvChanged(event.currentTarget.checked)
  }

  private onCacheGitHookEnvChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onCacheGitHookEnvChanged(event.currentTarget.checked)
  }

  private onSelectedShellChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    this.props.onSelectedShellChanged(event.currentTarget.value)
  }

  private renderHooksSettings() {
    return (
      <>
        {__FLATPAK__ && (
          <div className="git-hooks-flatpak-warning">
            <span className="warning-icon">⚠️</span>
            你正在运行 Flatpak 版本。Git 钩子在 Flatpak
            沙箱中运行，无法访问系统上安装的程序（例如版本管理器、代码检查工具或钩子所依赖的其他工具）。如果你的钩子依赖这些程序，请改而安装原生包。请参阅{' '}
            <LinkButton uri="https://github.com/desktop-plus/desktop-plus#download-and-installation-">
              安装说明
            </LinkButton>
            。
          </div>
        )}
        <Checkbox
          label="从 shell 加载 Git 钩子环境变量"
          ariaDescribedBy="git-hooks-env-description"
          value={
            this.props.enableGitHookEnv ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onEnableGitHookEnvChanged}
        />
        <p id="git-hooks-env-description" className="settings-description">
          启用后，Desktop Plus 将在执行 Git 钩子时尝试从你的 shell
          加载环境变量。如果你的 Git 钩子依赖 shell
          配置文件中设置的环境变量（nvm、rbenv、asdf
          等版本管理器的常见做法），这将很有用。
        </p>

        {this.props.enableGitHookEnv && __WIN32__ && (
          <>
            <Select
              className="git-hook-shell-select"
              label={'加载环境时使用的 shell'}
              value={this.props.selectedShell}
              onChange={this.onSelectedShellChanged}
            >
              {windowsShells
                .map(s => ({ key: s, title: shellFriendlyNames[s] }))
                .map(s => (
                  <option key={s.key} value={s.key}>
                    {s.title}
                  </option>
                ))}
            </Select>
          </>
        )}

        {this.props.enableGitHookEnv && (
          <>
            <Checkbox
              label="缓存 Git 钩子环境变量"
              ariaDescribedBy="git-hooks-cache-description"
              onChange={this.onCacheGitHookEnvChanged}
              value={
                this.props.cacheGitHookEnv
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
            />

            <div
              id="git-hooks-cache-description"
              className="settings-description"
            >
              缓存钩子环境变量以提升性能。如果你的钩子依赖频繁变化的环境变量，请禁用。
            </div>
          </>
        )}
      </>
    )
  }

  public render() {
    return (
      <DialogContent className="git-preferences">
        <TabBar
          selectedIndex={this.selectedTabIndex}
          onTabClicked={this.onTabClicked}
        >
          <span>作者</span>
          <span>默认分支</span>
          <span>钩子</span>
        </TabBar>
        <div className="git-preferences-content">{this.renderCurrentTab()}</div>
      </DialogContent>
    )
  }

  private renderCurrentTab() {
    if (this.selectedTabIndex === 0) {
      return this.renderGitConfigAuthorInfo()
    } else if (this.selectedTabIndex === 1) {
      return this.renderDefaultBranchSetting()
    } else if (this.selectedTabIndex === 2) {
      return this.renderHooksSettings()
    }

    return null
  }

  private onSetGlobalAuthorChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onSetGlobalAuthorChanged(event.currentTarget.checked)
  }

  private onShowCommitAuthorInfoChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onShowCommitAuthorInfoChanged(event.currentTarget.checked)
  }

  private renderGitConfigAuthorInfo() {
    return (
      <>
        <h2>全局作者</h2>
        <Checkbox
          label="将作者身份存储在全局 Git 配置中"
          value={
            this.props.setGlobalAuthor ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onSetGlobalAuthorChanged}
        />
        {!this.props.setGlobalAuthor && this.props.globalAuthorWasSet && (
          <div className="git-email-not-found-warning">
            <span className="warning-icon">⚠️</span>
            保存将从你的全局 Git 配置中移除 user.name 和
            user.email。请确保你的仓库已设置本地配置或 includeIf
            规则，否则提交可能失败。
          </div>
        )}
        <GitConfigUserForm
          email={this.props.email}
          name={this.props.name}
          isLoadingGitConfig={this.props.isLoadingGitConfig}
          accounts={this.props.accounts}
          onEmailChanged={this.props.onEmailChanged}
          onNameChanged={this.props.onNameChanged}
          disabled={!this.props.setGlobalAuthor}
        />
        {this.renderEditGlobalGitConfigInfo()}
        <h2>提交身份显示</h2>
        <Checkbox
          label="在提交信息上方显示有效身份与配置作用域"
          value={
            this.props.showCommitAuthorInfo
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onShowCommitAuthorInfoChanged}
        />
        <p className="git-settings-description">
          Git 会从多个具有不同优先级的配置文件中解析作者身份。{' '}
          <LinkButton uri="https://git-scm.com/docs/git-config#SCOPES">
            了解有关配置作用域的更多信息
          </LinkButton>
          。
        </p>
      </>
    )
  }

  private renderDefaultBranchSetting() {
    return (
      <div className="default-branch-component">
        <h2 id="default-branch-heading">新仓库的默认分支名</h2>

        <RefNameTextBox
          initialValue={this.props.defaultBranch}
          onValueChange={this.props.onDefaultBranchChanged}
          ariaLabelledBy={'default-branch-heading'}
          ariaDescribedBy="default-branch-description"
          warningMessageVerb="saved"
        />

        <p id="default-branch-description" className="settings-description">
          GitHub 的默认分支名是 <Ref>main</Ref>
          。你可能因为不同的工作流，或你的集成仍需要历史上的默认分支名{' '}
          <Ref>master</Ref>，而想要更改它。
        </p>

        {this.renderEditGlobalGitConfigInfo()}
      </div>
    )
  }

  private renderEditGlobalGitConfigInfo() {
    return (
      <p className="settings-description">
        这些偏好设置将{' '}
        <LinkButton onClick={this.props.onEditGlobalGitConfig}>
          编辑你的全局 Git 配置文件
        </LinkButton>
        。
      </p>
    )
  }
}
