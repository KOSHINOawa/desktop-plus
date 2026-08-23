import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IDeleteUnusedLocalBranchesProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branches: ReadonlyArray<Branch>
  readonly onDismissed: () => void
  readonly onDeleted: (repository: Repository) => void
}

interface IDeleteUnusedLocalBranchesState {
  readonly isDeleting: boolean
}

export class DeleteUnusedLocalBranches extends React.Component<
  IDeleteUnusedLocalBranchesProps,
  IDeleteUnusedLocalBranchesState
> {
  public constructor(props: IDeleteUnusedLocalBranchesProps) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    const count = this.props.branches.length

    return (
      <Dialog
        id="delete-unused-local-branches"
        title={__DARWIN__ ? '删除未使用的本地分支' : '删除未使用的本地分支'}
        type="warning"
        onSubmit={this.deleteBranches}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-unused-local-branches-message"
      >
        <DialogContent>
          <div id="delete-unused-local-branches-message">
            <p>删除以下 {count} 个本地分支？</p>
            <ul className="delete-unused-local-branches-list">
              {this.props.branches.map(branch => (
                <li key={branch.name}>
                  <Ref>{branch.name}</Ref>
                </li>
              ))}
            </ul>
            <p>此操作无法撤销。</p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="删除" />
        </DialogFooter>
      </Dialog>
    )
  }

  private deleteBranches = async () => {
    const { dispatcher, repository, branches } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteLocalBranches(repository, branches)
    this.props.onDeleted(repository)

    this.props.onDismissed()
  }
}
