import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { Branch } from '../../models/branch'

interface ICantDeleteCurrentBranchProps {
  readonly branchToDelete: Branch
  readonly blockedByBranch: Branch
  readonly onDismissed: () => void
}

export class CantDeleteCurrentBranch extends React.Component<ICantDeleteCurrentBranchProps> {
  public render() {
    const { branchToDelete, blockedByBranch } = this.props
    return (
      <Dialog
        id="cant-delete-current-branch"
        title={__DARWIN__ ? '无法删除分支' : '无法删除分支'}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            你无法删除当前正在使用的分支，因为{' '}
            <Ref>{blockedByBranch.name}</Ref> 正被另一个工作树使用，无法自动检出。
          </p>
          <p>
            在删除 <Ref>{branchToDelete.name}</Ref> 之前，请先切换到一个新分支。
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="关闭"
            cancelButtonVisible={false}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
