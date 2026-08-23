import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { Branch } from '../../models/branch'

interface ICantDeleteMainBranchProps {
  readonly branchToDelete: Branch
  readonly onDismissed: () => void
}

export class CantDeleteMainBranch extends React.Component<ICantDeleteMainBranchProps> {
  public render() {
    const { branchToDelete } = this.props
    return (
      <Dialog
        id="cant-delete-main-branch"
        title={__DARWIN__ ? '无法删除分支' : '无法删除分支'}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            你无法删除默认分支 <Ref>{branchToDelete.name}</Ref>
            ，因为它当前已被检出。
          </p>
          <p>在移除该分支之前，你需要先切换到一个不同的分支。</p>
          <div className="secondary-text">
            提示：你可以右键点击某个分支并选择"设为默认分支"来更改仓库的默认分支。
          </div>
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
