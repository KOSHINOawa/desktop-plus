import * as React from 'react'

import { Row } from '../lib/row'
import {
  Dialog,
  DialogError,
  DialogContent,
  DefaultDialogFooter,
} from '../dialog'
import { LinkButton } from '../lib/link-button'
import { IUpdateState, UpdateStatus } from '../lib/update-store'
import { Loading } from '../lib/loading'
import { RelativeTime } from '../relative-time'
import { assertNever } from '../../lib/fatal-error'
import {
  DesktopPlusReleaseNotesUri,
  UpstreamReleaseNotesUri,
} from '../lib/releases'
import { encodePathAsUrl } from '../../lib/path'
import { isOSNoLongerSupportedByElectron } from '../../lib/get-os'
import { AriaLiveContainer } from '../accessibility/aria-live-container'
import { formatDate } from '../../lib/format-date'

const logoPath = 'static/logo.png'
const DesktopLogo = encodePathAsUrl(__dirname, logoPath)

interface IAboutProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissible prop.
   */
  readonly onDismissed: () => void

  /**
   * The name of the currently installed (and running) application
   */
  readonly applicationName: string

  /**
   * The currently installed (and running) version of the app.
   */
  readonly applicationVersion: string

  /**
   * The currently installed (and running) architecture of the app.
   */
  readonly applicationArchitecture: string

  readonly onShowAcknowledgements: () => void

  /** A function to call when the user wants to see Terms and Conditions. */
  readonly onShowTermsAndConditions: () => void

  readonly updateState: IUpdateState

  /**
   * A flag to indicate whether the About dialog should ignore that
   * it's running in development mode. Used exclusively by the AboutTestDialog
   */
  readonly allowDevelopment?: boolean
}

interface IUpdateInfoProps {
  readonly message: string
  readonly richMessage?: JSX.Element
  readonly loading?: boolean
}

class UpdateInfo extends React.Component<IUpdateInfoProps> {
  public render() {
    return (
      <div className="update-status">
        <AriaLiveContainer message={this.props.message} />

        {this.props.loading && <Loading />}
        {this.props.richMessage ?? this.props.message}
      </div>
    )
  }
}

/**
 * A dialog that presents information about the
 * running application such as name and version.
 */
export class About extends React.Component<IAboutProps> {
  private get canCheckForUpdates() {
    return (
      __RELEASE_CHANNEL__ !== 'development' ||
      this.props.allowDevelopment === true
    )
  }

  private renderUpdateButton() {
    return (
      <Row>
        <p className="no-padding">
          <LinkButton uri={DesktopPlusReleaseNotesUri}>
            Desktop Plus 正式版
          </LinkButton>
          <span className="separator">|</span>
          <LinkButton uri={UpstreamReleaseNotesUri}>上游正式版</LinkButton>
        </p>
      </Row>
    )
  }

  private renderUpdateDetails() {
    if (__LINUX__) {
      return <p>请访问 Desktop Plus 发布页面以查看发布说明并下载最新版本。</p>
    }

    if (!this.canCheckForUpdates) {
      return <p>该应用程序当前在开发模式下运行，不会接收任何更新。</p>
    }

    const { status, lastSuccessfulCheck } = this.props.updateState

    switch (status) {
      case UpdateStatus.CheckingForUpdates:
        return <UpdateInfo message="正在检查更新…" loading={true} />
      case UpdateStatus.UpdateAvailable:
        return <UpdateInfo message="正在下载更新…" loading={true} />
      case UpdateStatus.UpdateNotAvailable:
        if (!lastSuccessfulCheck) {
          return null
        }

        const richMessage = (
          <p>
            你拥有最新版本 (最后检查于{' '}
            <RelativeTime date={lastSuccessfulCheck} />)
          </p>
        )

        const absoluteDate = formatDate(lastSuccessfulCheck, {
          dateStyle: 'full',
          timeStyle: 'short',
        })

        return (
          <UpdateInfo
            message={`你拥有最新版本（最后检查于 ${absoluteDate}）`}
            richMessage={richMessage}
          />
        )
      case UpdateStatus.UpdateReady:
        return <UpdateInfo message="更新已下载完毕，准备安装。" />
      case UpdateStatus.UpdateNotChecked:
        return null
      default:
        return assertNever(status, `Unknown update status ${status}`)
    }
  }

  private renderUpdateErrors() {
    if (__LINUX__) {
      return null
    }

    if (!this.canCheckForUpdates) {
      return null
    }

    if (isOSNoLongerSupportedByElectron()) {
      return (
        <DialogError>
          此操作系统不再受支持。软件更新已禁用。{' '}
          <LinkButton uri="https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems">
            受支持的操作系统
          </LinkButton>
        </DialogError>
      )
    }

    return null
  }

  private renderBetaLink() {
    return
  }

  public render() {
    const name = this.props.applicationName
    const version = this.props.applicationVersion
    const releaseNotesLink = (
      <LinkButton uri={DesktopPlusReleaseNotesUri}>发布说明</LinkButton>
    )

    const versionText = __DEV__ ? `构建 ${version}` : `版本 ${version}`
    const titleId = 'Dialog_about'

    return (
      <Dialog
        id="about"
        titleId={titleId}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderUpdateErrors()}
        <DialogContent>
          <Row className="logo">
            <img src={DesktopLogo} alt="Desktop Plus" width="64" height="64" />
          </Row>
          <h1 id={titleId}>关于 {name}</h1>
          <p className="no-padding">
            <span className="selectable-text">
              {versionText} ({this.props.applicationArchitecture})
            </span>{' '}
            ({releaseNotesLink})
          </p>
          由 KOSHINO 制作的中文化改版，并增加了“交流式提交”支持。
          {this.renderUpdateDetails()}
          {this.renderUpdateButton()}
          {this.renderBetaLink()}
          <div className="terms-and-license-container">
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowTermsAndConditions}>
                条款与条件
              </LinkButton>
            </p>
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowAcknowledgements}>
                许可证和开源声明
              </LinkButton>
            </p>
            <p className="terms-and-license">
              <LinkButton uri="https://gh.io/copilot-for-desktop-transparency">
                在 Desktop Plus 中负责任地使用 Copilot
              </LinkButton>
            </p>
          </div>
        </DialogContent>
        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
