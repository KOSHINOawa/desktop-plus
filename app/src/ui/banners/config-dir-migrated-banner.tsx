import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface IConfigDirMigratedBannerProps {
  readonly migratedFromAppName: string
  readonly onDismissed: () => void
}

export class ConfigDirMigratedBanner extends React.Component<IConfigDirMigratedBannerProps> {
  public render() {
    return (
      <SuccessBanner timeout={15000} onDismissed={this.props.onDismissed}>
        您从 <strong>{this.props.migratedFromAppName}</strong>{' '}
        的设置已成功迁移。
      </SuccessBanner>
    )
  }
}
