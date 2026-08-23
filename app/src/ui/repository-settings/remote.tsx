import * as React from 'react'
import { IRemote } from '../../models/remote'
import { TextBox } from '../lib/text-box'
import { DialogContent } from '../dialog'
import { Account } from '../../models/account'
import { AccountPicker } from '../account-picker'
import { Repository } from '../../models/repository'
import { getDotComAPIEndpoint, getEndpointForRepository } from '../../lib/api'

interface IRemoteProps {
  /** The remote being shown. */
  readonly remote: IRemote

  readonly repository: Repository

  readonly account: Account | null

  readonly accounts: ReadonlyArray<Account>

  /** The default branch being shown. */
  readonly defaultBranch: string | undefined

  /** The function to call when the remote URL is changed by the user. */
  readonly onRemoteUrlChanged: (url: string) => void

  /** The function to call when the default branch is changed by the user. */
  readonly onDefaultBranchChanged: (branch: string) => void

  /** The function to call when the account is changed by the user. */
  readonly onSelectedAccountChanged: (account: Account) => void
}

/** The Remote component. */
export class Remote extends React.Component<IRemoteProps, {}> {
  public render() {
    const { remote, defaultBranch } = this.props

    const repoEndpoint = this.props.repository.url
      ? getEndpointForRepository(this.props.repository.url)
      : null
    const endpoint = repoEndpoint ?? getDotComAPIEndpoint()
    const noAccount = Account.anonymous()

    const account = this.props.account ?? noAccount

    const accounts: ReadonlyArray<Account> = [
      noAccount,
      ...this.props.accounts.filter(a => a.endpoint === endpoint),
    ]

    return (
      <DialogContent>
        <div className="config-row">
          <TextBox
            placeholder="远程 URL"
            label={
              __DARWIN__
                ? `主远程仓库（${remote.name}）URL`
                : `主远程仓库（${remote.name}）URL`
            }
            value={remote.url}
            onValueChanged={this.props.onRemoteUrlChanged}
          />
        </div>
        <div className="config-row">
          <p>覆盖远程的默认分支</p>
          <TextBox
            placeholder="默认分支"
            value={defaultBranch}
            onValueChanged={this.props.onDefaultBranchChanged}
          />
        </div>
        <div className="config-row">
          <AccountPicker
            accounts={accounts}
            openButtonClassName="dialog-preferred-focus"
            selectedAccount={account}
            onSelectedAccountChanged={this.props.onSelectedAccountChanged}
          />
        </div>
        <div className="config-row">
          <TextBox
            placeholder="端点"
            readOnly={true}
            label="API 端点"
            value={endpoint}
          />
        </div>
      </DialogContent>
    )
  }
}
