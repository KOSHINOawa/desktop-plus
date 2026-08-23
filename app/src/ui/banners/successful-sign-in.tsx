import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ISuccessfulSignInProps {
  readonly login: string
  readonly friendlyEndpoint: string
  readonly onDismissed: () => void
}

export class SuccessfulSignIn extends React.Component<ISuccessfulSignInProps> {
  public render() {
    return (
      <SuccessBanner timeout={5000} onDismissed={this.props.onDismissed}>
        成功登录到 {this.props.friendlyEndpoint}，用户为{' '}
        <strong>{this.props.login}</strong>.
      </SuccessBanner>
    )
  }
}
