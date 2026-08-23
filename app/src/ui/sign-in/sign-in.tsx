import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import {
  SignInState,
  SignInStep,
  IEndpointEntryState,
  IAuthenticationState,
  IExistingAccountWarning,
  ITokenEntryState,
} from '../../lib/stores'
import {
  friendlySelfHostedName,
  getSelfHostedTokenSettingsURL,
  isSelfHostedApiType,
  SelfHostedApiType,
  selfHostedTokenScopes,
} from '../../lib/stores/sign-in-store'
import { assertNever } from '../../lib/fatal-error'
import { Row } from '../lib/row'
import { TextBox } from '../lib/text-box'
import { PasswordTextBox } from '../lib/password-text-box'
import { LinkButton } from '../lib/link-button'
import { Dialog, DialogError, DialogContent, DialogFooter } from '../dialog'

import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { getHTMLURL } from '../../lib/api'

interface ISignInProps {
  readonly dispatcher: Dispatcher
  readonly signInState: SignInState | null
  readonly onDismissed: () => void
  readonly isCredentialHelperSignIn?: boolean
  readonly credentialHelperUrl?: string
}

interface ISignInState {
  readonly endpoint: string
  readonly token: string
}

const SignInWithBrowserTitle = __DARWIN__ ? '使用浏览器登录' : '使用浏览器登录'

const DefaultTitle = '登录'

const browserSignInInfoContent = (
  <p>
    登录后，你的浏览器会将你重定向回 Desktop Plus。 如果你的浏览器请求允许启动
    Desktop Plus，请允许。
  </p>
)

export class SignIn extends React.Component<ISignInProps, ISignInState> {
  private readonly dialogRef = React.createRef<Dialog>()

  public constructor(props: ISignInProps) {
    super(props)

    this.state = {
      endpoint: '',
      token: '',
    }
  }

  public componentDidUpdate(prevProps: ISignInProps) {
    // Whenever the sign in step changes we replace the dialog contents which
    // means we need to re-focus the first suitable child element as it's
    // essentially a "new" dialog we're showing only the dialog component itself
    // doesn't know that.
    if (prevProps.signInState !== null && this.props.signInState !== null) {
      if (prevProps.signInState.kind !== this.props.signInState.kind) {
        this.dialogRef.current?.focusFirstSuitableChild()
      }
    }
  }

  public componentWillReceiveProps(nextProps: ISignInProps) {
    if (nextProps.signInState !== this.props.signInState) {
      if (
        nextProps.signInState &&
        nextProps.signInState.kind === SignInStep.Success
      ) {
        this.onDismissed()
      }
    }
  }

  private onSubmit = () => {
    const state = this.props.signInState

    if (!state) {
      return
    }

    const stepKind = state.kind

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        this.props.dispatcher.setSignInEndpoint(this.state.endpoint)
        break
      case SignInStep.ExistingAccountWarning:
        this.props.dispatcher
          .removeAccount(state.existingAccount)
          .then(() => this.props.dispatcher.setSignInEndpoint(state.endpoint))
        break
      case SignInStep.Authentication:
        this.props.dispatcher.requestBrowserAuthentication()
        break
      case SignInStep.TokenEntry:
        this.props.dispatcher.setSignInToken(this.state.token)
        break
      case SignInStep.Success:
        this.onDismissed()
        break
      default:
        assertNever(state, `Unknown sign in step ${stepKind}`)
    }
  }

  private onEndpointChanged = (endpoint: string) => {
    this.setState({ endpoint })
  }

  private onTokenChanged = (token: string) => {
    this.setState({ token })
  }

  private renderFooter(): JSX.Element | null {
    const state = this.props.signInState

    if (!state || state.kind === SignInStep.Success) {
      return null
    }

    let disableSubmit = false

    let primaryButtonText: string
    const stepKind = state.kind
    const continueWithBrowserLabel = __DARWIN__
      ? '使用浏览器继续'
      : '使用浏览器继续'

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        disableSubmit = this.state.endpoint.length === 0
        primaryButtonText = '继续'
        break
      case SignInStep.ExistingAccountWarning:
        primaryButtonText = continueWithBrowserLabel
        break
      case SignInStep.Authentication:
        primaryButtonText = continueWithBrowserLabel
        break
      case SignInStep.TokenEntry:
        disableSubmit = this.state.token.length === 0
        primaryButtonText = __DARWIN__ ? '登录' : '登录'
        break
      default:
        return assertNever(state, `Unknown sign in step ${stepKind}`)
    }

    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={primaryButtonText}
          okButtonDisabled={disableSubmit || state.loading}
          cancelButtonDisabled={false}
          onCancelButtonClick={this.onDismissed}
        />
      </DialogFooter>
    )
  }

  private renderExistingAccountWarningStep(state: IExistingAccountWarning) {
    return (
      <DialogContent>
        <p className="existing-account-warning">
          你已使用账户 <Ref>{state.existingAccount.login}</Ref> 登录到{' '}
          <Ref>{new URL(getHTMLURL(state.endpoint)).host}</Ref>
          。如果继续，你将先被登出。
        </p>
        {browserSignInInfoContent}
      </DialogContent>
    )
  }

  private renderEndpointEntryStep(state: IEndpointEntryState) {
    return (
      <DialogContent>
        <Row>
          <TextBox
            label="企业地址"
            value={this.state.endpoint}
            onValueChanged={this.onEndpointChanged}
            placeholder="https://example.ghe.com"
          />
        </Row>
      </DialogContent>
    )
  }

  private renderSelfHostedEndpointEntryStep(apiType: SelfHostedApiType) {
    return (
      <DialogContent>
        <Row>
          <TextBox
            label={`${friendlySelfHostedName(apiType)} 地址`}
            value={this.state.endpoint}
            onValueChanged={this.onEndpointChanged}
            placeholder="https://git.example.com"
          />
        </Row>
      </DialogContent>
    )
  }

  private renderTokenEntryStep(state: ITokenEntryState) {
    const { apiType, webBaseUrl } = state

    return (
      <DialogContent>
        {this.renderCredentialHelperInfo()}
        <p>
          正在使用个人访问令牌登录到 <Ref>{webBaseUrl}</Ref>。
        </p>
        <Row>
          <PasswordTextBox
            label="个人访问令牌"
            value={this.state.token}
            onValueChanged={this.onTokenChanged}
            ariaDescribedBy="sign-in-token-description"
          />
        </Row>
        <Row>
          <div id="sign-in-token-description">
            在你的{' '}
            <LinkButton
              uri={getSelfHostedTokenSettingsURL(webBaseUrl, apiType)}
            >
              {friendlySelfHostedName(apiType)} 设置
            </LinkButton>
            中创建一个具有{' '}
            <Ref>{selfHostedTokenScopes[apiType].join(', ')}</Ref>{' '}
            权限范围的令牌。
          </div>
        </Row>
      </DialogContent>
    )
  }

  private renderAuthenticationStep(state: IAuthenticationState) {
    const credentialHelperInfo =
      this.props.isCredentialHelperSignIn && this.props.credentialHelperUrl ? (
        <p>
          Git 正在请求访问 <Ref>{this.props.credentialHelperUrl}</Ref> 的凭据。
        </p>
      ) : undefined

    return (
      <DialogContent>
        {credentialHelperInfo}
        {browserSignInInfoContent}
      </DialogContent>
    )
  }

  /** Explains that git, rather than the user, asked for these credentials. */
  private renderCredentialHelperInfo() {
    return this.props.isCredentialHelperSignIn &&
      this.props.credentialHelperUrl ? (
      <p>
        Git 正在请求访问 <Ref>{this.props.credentialHelperUrl}</Ref> 的凭据。
      </p>
    ) : undefined
  }

  private renderStep(): JSX.Element | null {
    const state = this.props.signInState

    if (!state) {
      return null
    }

    if (
      state.kind === SignInStep.EndpointEntry &&
      isSelfHostedApiType(state.apiType)
    ) {
      return this.renderSelfHostedEndpointEntryStep(state.apiType)
    }

    const stepKind = state.kind

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        return this.renderEndpointEntryStep(state)
      case SignInStep.ExistingAccountWarning:
        return this.renderExistingAccountWarningStep(state)
      case SignInStep.Authentication:
        return this.renderAuthenticationStep(state)
      case SignInStep.TokenEntry:
        return this.renderTokenEntryStep(state)
      case SignInStep.Success:
        return null
      default:
        return assertNever(state, `Unknown sign in step ${stepKind}`)
    }
  }

  public render() {
    const state = this.props.signInState

    if (!state || state.kind === SignInStep.Success) {
      return null
    }

    const errors = state.error ? (
      <DialogError>{state.error.message}</DialogError>
    ) : null

    const title =
      this.props.signInState.kind === SignInStep.Authentication
        ? SignInWithBrowserTitle
        : DefaultTitle

    return (
      <Dialog
        id="sign-in"
        title={title}
        disabled={false}
        onDismissed={this.onDismissed}
        onSubmit={this.onSubmit}
        loading={state.loading}
        ref={this.dialogRef}
      >
        {errors}
        {this.renderStep()}
        {this.renderFooter()}
      </Dialog>
    )
  }

  private onDismissed = () => {
    this.props.dispatcher.resetSignInState()
    this.props.onDismissed()
  }
}
