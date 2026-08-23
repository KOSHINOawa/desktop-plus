import * as React from 'react'
import { WelcomeStep } from './welcome'
import { LinkButton } from '../lib/link-button'
import { Dispatcher } from '../dispatcher'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { BrowserRedirectMessage } from '../lib/authentication-form'
import { ENABLE_TELEMETRY } from '../../lib/telemetry-flag'
import { SamplesURL } from '../../lib/stats'

/**
 * The URL to the sign-up page on GitHub.com. Used in conjunction
 * with account actions in the app where the user might want to
 * consider signing up.
 */
export const CreateAccountURL = 'https://github.com/join?source=github-desktop'

interface IStartProps {
  readonly advance: (step: WelcomeStep) => void
  readonly dispatcher: Dispatcher
  readonly loadingBrowserAuth: boolean
}

/** The first step of the Welcome flow. */
export class Start extends React.Component<IStartProps, {}> {
  public render() {
    return (
      <section
        id="start"
        aria-label="欢迎使用 Desktop Plus"
        aria-describedby="start-description"
      >
        <div className="start-content">
          <h1 className="welcome-title">
            欢迎来到<span>Desktop Plus</span>
          </h1>
          {!this.props.loadingBrowserAuth ? (
            <>
              <p id="start-description" className="welcome-text">
                Desktop Plus 是一种便捷的方式，让您可以参与 GitHub
                和其他平台上的项目。请在下方登录，开始参与您现有的项目。
              </p>
            </>
          ) : (
            <p>{BrowserRedirectMessage}</p>
          )}

          <div className="welcome-main-buttons">
            <Button
              type="submit"
              className="button-with-icon"
              disabled={this.props.loadingBrowserAuth}
              onClick={this.signInWithBrowser}
              autoFocus={true}
              role="link"
            >
              {this.props.loadingBrowserAuth && <Loading />}
              通过 GitHub.com 登录
              <Octicon symbol={octicons.linkExternal} />
            </Button>
            {this.props.loadingBrowserAuth ? (
              <Button onClick={this.cancelBrowserAuth}>取消</Button>
            ) : (
              <Button onClick={this.signInToEnterprise}>
                通过 GitHub Enterprise 登录
              </Button>
            )}
          </div>
          <div className="skip-action-container">
            <p className="welcome-text">
              刚来到 GitHub?{' '}
              <LinkButton
                uri={CreateAccountURL}
                className="create-account-link"
              >
                创建你的免费账户。
              </LinkButton>
            </p>
            <LinkButton className="skip-button" onClick={this.skip}>
              待会再说。
            </LinkButton>
          </div>
        </div>

        <div className="start-footer">
          <p>
            通过创建账户，您同意{' '}
            <LinkButton uri={'https://github.com/site/terms'}>
              服务条款
            </LinkButton>
            。有关 GitHub 隐私实践的更多信息，请参见{' '}
              <LinkButton uri={'https://github.com/site/privacy'}>
                GitHub 隐私声明。
              </LinkButton>
          </p>
          {ENABLE_TELEMETRY && (
            <p>
              GitHub Desktop 发送使用情况指标以改进产品并指导功能决策。{' '}
              <LinkButton uri={SamplesURL}>
                了解更多关于用户指标的信息。
              </LinkButton>
            </p>
          )}
        </div>
      </section>
    )
  }

  private signInWithBrowser = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }

    this.props.advance(WelcomeStep.SignInToDotComWithBrowser)
    this.props.dispatcher.requestBrowserAuthenticationToDotcom()
  }

  private cancelBrowserAuth = () => {
    this.props.advance(WelcomeStep.Start)
  }

  private signInToEnterprise = () => {
    this.props.advance(WelcomeStep.SignInToEnterprise)
  }

  private skip = () => {
    this.props.advance(WelcomeStep.ConfigureGit)
  }
}
