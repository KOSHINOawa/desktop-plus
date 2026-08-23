import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { PopupType } from '../../models/popup'
import { PreferencesTab } from '../../models/preferences'
import { LinkButton } from '../lib/link-button'
import { SuccessBanner } from './success-banner'

interface IWorktreesEnabledBannerProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
}

export class WorktreesEnabledBanner extends React.Component<IWorktreesEnabledBannerProps> {
  private onOpenAppearanceSettings = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.Preferences,
      initialSelectedTab: PreferencesTab.Appearance,
    })
  }

  public render() {
    const label = __DARWIN__ ? '外观设置' : '外观选项'

    return (
      <SuccessBanner timeout={8000} onDismissed={this.props.onDismissed}>
        工作树已启用。您可以在{' '}
        <LinkButton onClick={this.onOpenAppearanceSettings}>{label}</LinkButton>
        中更改此设置。
      </SuccessBanner>
    )
  }
}
