import * as React from 'react'
import { ENABLE_TELEMETRY } from '../../lib/telemetry-flag'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import { SamplesURL } from '../../lib/stats'
import { isWindowsOpenSSHAvailable } from '../../lib/ssh/ssh'

interface IAdvancedPreferencesProps {
  readonly useWindowsOpenSSH: boolean
  readonly optOutOfUsageTracking: boolean
  readonly useExternalCredentialHelper: boolean
  readonly repositoryIndicatorsEnabled: boolean
  readonly hideWindowOnQuit: boolean
  readonly onUseWindowsOpenSSHChanged: (checked: boolean) => void
  readonly onOptOutofReportingChanged: (checked: boolean) => void
  readonly onUseExternalCredentialHelperChanged: (checked: boolean) => void
  readonly onRepositoryIndicatorsEnabledChanged: (enabled: boolean) => void
  readonly onHideWindowOnQuitChanged: (enabled: boolean) => void
}

interface IAdvancedPreferencesState {
  readonly optOutOfUsageTracking: boolean
  readonly canUseWindowsSSH: boolean
  readonly useExternalCredentialHelper: boolean
}

export class Advanced extends React.Component<
  IAdvancedPreferencesProps,
  IAdvancedPreferencesState
> {
  public constructor(props: IAdvancedPreferencesProps) {
    super(props)

    this.state = {
      optOutOfUsageTracking: this.props.optOutOfUsageTracking,
      canUseWindowsSSH: false,
      useExternalCredentialHelper: this.props.useExternalCredentialHelper,
    }
  }

  public componentDidMount() {
    this.checkSSHAvailability()
  }

  private async checkSSHAvailability() {
    this.setState({ canUseWindowsSSH: await isWindowsOpenSSHAvailable() })
  }

  private onReportingOptOutChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ optOutOfUsageTracking: value })
    this.props.onOptOutofReportingChanged(value)
  }

  private onUseExternalCredentialHelperChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ useExternalCredentialHelper: value })
    this.props.onUseExternalCredentialHelperChanged(value)
  }

  private onRepositoryIndicatorsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onRepositoryIndicatorsEnabledChanged(event.currentTarget.checked)
  }

  private onUseWindowsOpenSSHChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onUseWindowsOpenSSHChanged(event.currentTarget.checked)
  }

  private onHideWindowOnQuitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onHideWindowOnQuitChanged(event.currentTarget.checked)
  }

  private reportDesktopUsageLabel() {
    return (
      <span>
        帮助 Desktop Plus 改进，提交{' '}
        <LinkButton uri={SamplesURL}>使用情况统计</LinkButton>
      </span>
    )
  }

  public render() {
    return (
      <DialogContent>
        {!__DARWIN__ && this.renderAppSettings()}
        <div className="advanced-section">
          <h2>后台更新</h2>
          <Checkbox
            label="在仓库列表中显示状态图标"
            value={
              this.props.repositoryIndicatorsEnabled
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onRepositoryIndicatorsEnabledChanged}
            ariaDescribedBy="periodic-fetch-description"
          />
          <div id="periodic-fetch-description" className="settings-description">
            <p>
              这些图标用来指示哪些仓库有本地或远程更改，并需要定期抓取当前未选中的仓库。
            </p>
            <p>
              关闭此选项不会停止对当前所选仓库的定期抓取，但可能会改善拥有大量仓库时的整体性能。
            </p>
          </div>
        </div>
        {ENABLE_TELEMETRY && (
          <div className="advanced-section">
            <h2>使用情况</h2>
            <Checkbox
              label={this.reportDesktopUsageLabel()}
              value={
                this.state.optOutOfUsageTracking
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onReportingOptOutChanged}
            />
          </div>
        )}
        <h2>网络与凭据</h2>
        {this.renderSSHSettings()}
        <div className="advanced-section">
          <Checkbox
            label={'使用 Git Credential Manager'}
            value={
              this.state.useExternalCredentialHelper
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onUseExternalCredentialHelperChanged}
            ariaDescribedBy="use-external-credential-helper-description"
          />
          <div
            id="use-external-credential-helper-description"
            className="settings-description"
          >
            <p>
              对于 GitHub.com 之外的私有仓库，使用{' '}
              <LinkButton uri="https://gh.io/gcm">
                Git Credential Manager{' '}
              </LinkButton>
              。此功能为实验性，可能会发生变化。
            </p>
          </div>
        </div>
      </DialogContent>
    )
  }

  private renderSSHSettings() {
    if (!this.state.canUseWindowsSSH) {
      return null
    }

    return (
      <div className="advanced-section">
        <Checkbox
          label="使用系统 OpenSSH（推荐）"
          value={
            this.props.useWindowsOpenSSH ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onUseWindowsOpenSSHChanged}
        />
      </div>
    )
  }

  private renderAppSettings() {
    return (
      <div className="advanced-section">
        <h2>应用</h2>
        <Checkbox
          label="关闭窗口而非退出应用"
          value={
            this.props.hideWindowOnQuit ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onHideWindowOnQuitChanged}
        />
        <div className="git-settings-description">
          <p>关闭窗口后，应用将继续在后台运行。使用 Ctrl+Q 可完全退出应用。</p>
        </div>
      </div>
    )
  }
}
