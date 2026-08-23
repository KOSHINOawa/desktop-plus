import * as React from 'react'
import { Dispatcher } from '../dispatcher/index'
import { LinkButton } from '../lib/link-button'
import {
  UpdateStatus,
  lastShowCaseVersionSeen,
  updateStore,
} from '../lib/update-store'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { PopupType } from '../../models/popup'
import { shell } from '../../lib/app-shell'

import { ReleaseSummary } from '../../models/release-notes'
import { Banner } from './banner'
import { DesktopPlusReleaseNotesUri } from '../lib/releases'
import { RichText } from '../lib/rich-text'
import { Emoji } from '../../lib/emoji'

interface IUpdateAvailableProps {
  readonly dispatcher: Dispatcher
  readonly newReleases: ReadonlyArray<ReleaseSummary> | null
  readonly isX64ToARM64ImmediateAutoUpdate: boolean
  readonly isUpdateShowcaseVisible: boolean
  readonly emoji: Map<string, Emoji>
  readonly onDismissed: () => void
  readonly prioritizeUpdate: boolean
  readonly prioritizeUpdateInfoUrl: string | undefined
}

/**
 * A component which tells the user an update is available and gives them the
 * option of moving into the future or being a luddite.
 */
export class UpdateAvailable extends React.Component<IUpdateAvailableProps> {
  public render() {
    return (
      <Banner
        id="update-available"
        className={this.props.prioritizeUpdate ? 'priority' : undefined}
        dismissable={!this.props.prioritizeUpdate}
        onDismissed={this.onDismissed}
      >
        {this.renderIcon()}
        {this.renderMessage()}
      </Banner>
    )
  }

  private onDismissed = () => {
    if (this.props.isUpdateShowcaseVisible) {
      return this.dismissUpdateShowCaseVisibility()
    }

    this.props.onDismissed()
  }

  private renderIcon() {
    if (this.props.isUpdateShowcaseVisible) {
      return null
    }

    if (this.props.prioritizeUpdate) {
      return <Octicon className="warning-icon" symbol={octicons.alert} />
    }

    return (
      <Octicon className="download-icon" symbol={octicons.desktopDownload} />
    )
  }

  private renderMessage = () => {
    if (this.props.isX64ToARM64ImmediateAutoUpdate) {
      return (
        <span onSubmit={this.updateNow}>
          为您的桌面增强版提供了优化版本 使用{' '}
          {__DARWIN__ ? 'Apple silicon' : 'Arm64'}{' '}
          的机器并将在下次启动时安装，你也可以{' '}
          <LinkButton onClick={this.updateNow}>
            重新启动 Desktop Plus
          </LinkButton>{' '}
        </span>
      )
    }

    if (this.props.isUpdateShowcaseVisible) {
      const version =
        this.props.newReleases !== null
          ? ` 于 Desktop Plus ${this.props.newReleases[0].latestVersion}`
          : ''

      return (
        <span>
          <span aria-hidden="true">
            <RichText
              className="banner-emoji"
              text={':tada:'}
              emoji={this.props.emoji}
            />
          </span>
          令人兴奋的新功能已添加{version}。 查看{' '}
          <LinkButton onClick={this.showReleaseNotes}>有什么更新</LinkButton>{' '}
          或者{' '}
          <LinkButton onClick={this.dismissUpdateShowCaseVisibility}>
            忽略
          </LinkButton>
          .
        </span>
      )
    }

    if (this.props.prioritizeUpdate) {
      return (
        <span onSubmit={this.updateNow}>
          这个版本 Desktop Plus 缺少{' '}
          {this.props.prioritizeUpdateInfoUrl ? (
            <LinkButton uri={this.props.prioritizeUpdateInfoUrl}>
              重要更新
            </LinkButton>
          ) : (
            '重要更新'
          )}
          。 请立刻{' '}
          <LinkButton onClick={this.updateNow}>重启 Desktop Plus</LinkButton>{' '}
          来安装待定的更新。
        </span>
      )
    }

    return (
      <span onSubmit={this.updateNow}>
        有新的 Desktop Plus 版本可用，将在下次启动时安装。查看{' '}
        <LinkButton onClick={this.showReleaseNotes}>有什么更新</LinkButton> 或者{' '}
        <LinkButton onClick={this.updateNow}>重启 Desktop Plus</LinkButton>.
      </span>
    )
  }

  private dismissUpdateShowCaseVisibility = () => {
    // Note: under that scenario that this is being dismissed due to clicking
    // what's new on a pending release and for some reason we don't have the
    // releases. We will end up showing the showcase banner after restart. This
    // shouldn't happen but even if it did it would just be a minor annoyance as
    // user would need to dismiss it again.
    const versionSeen =
      this.props.newReleases === null
        ? __APP_VERSION__
        : this.props.newReleases[0].latestVersion

    localStorage.setItem(lastShowCaseVersionSeen, versionSeen)
    this.props.dispatcher.setUpdateShowCaseVisibility(false)
  }

  private showReleaseNotes = () => {
    if (this.props.newReleases == null) {
      // if, for some reason we're not able to render the release notes we
      // should redirect the user to the website so we do _something_
      shell.openExternal(DesktopPlusReleaseNotesUri)
    } else {
      this.props.dispatcher.showPopup({
        type: PopupType.ReleaseNotes,
        newReleases: this.props.newReleases,
      })
    }

    this.dismissUpdateShowCaseVisibility()
  }

  private updateNow = () => {
    if (
      (__RELEASE_CHANNEL__ === 'development' ||
        __RELEASE_CHANNEL__ === 'test') &&
      updateStore.state.status !== UpdateStatus.UpdateReady
    ) {
      this.props.onDismissed()
      return // causes a crash.. if no update is available
    }

    updateStore.quitAndInstallUpdate()
  }
}
