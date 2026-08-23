import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IAttributeMismatchProps {
  /** Called when the dialog should be dismissed. */
  readonly onDismissed: () => void

  /** Called when the user has chosen to replace the update filters. */
  readonly onUpdateExistingFilters: () => void

  readonly onEditGlobalGitConfig: () => void
}

export class AttributeMismatch extends React.Component<IAttributeMismatchProps> {
  public render() {
    return (
      <Dialog
        id="lfs-attribute-mismatch"
        title={
          __DARWIN__
            ? '更新现有的 Git LFS 过滤器？'
            : '更新现有的 Git LFS 过滤器？'
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            Git LFS 过滤器已在{' '}
            <LinkButton onClick={this.props.onEditGlobalGitConfig}>
              您的全局 git 配置
            </LinkButton>{' '}
            中配置，但与其预期的值不符。您想要现在更新它们吗？
          </p>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? '更新现有过滤器' : '更新现有过滤器'}
            cancelButtonText={__DARWIN__ ? '暂不' : '暂不'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = () => {
    this.props.onUpdateExistingFilters()
    this.props.onDismissed()
  }
}
