import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { Branch } from '../../models/branch'

interface ICantDeleteCurrentBranchUncommittedChangesProps {
  readonly branchToDelete: Branch
  readonly onDismissed: () => void
}

export class CantDeleteCurrentBranchUncommittedChanges extends React.Component<ICantDeleteCurrentBranchUncommittedChangesProps> {
  public render() {
    const { branchToDelete } = this.props
    return (
      <Dialog
        id="cant-delete-current-branch-uncommitted-changes"
        title={__DARWIN__ ? '无法删除分支' : '无法删除分支'}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            你无法移除 <Ref>{branchToDelete.name}</Ref>，因为你有正在进行的更改。
          </p>
          <p>你需要执行以下操作之一：</p>
          <ul>
            <li>提交你的更改。</li>
            <li>丢弃所有更改。</li>
            <li>在移除当前分支之前切换到一个不同的分支。</li>
          </ul>
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
