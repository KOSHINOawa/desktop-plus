import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ICherryPickUndoneBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
}

export class CherryPickUndone extends React.Component<
  ICherryPickUndoneBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, targetBranchName, onDismissed } = this.props
    return (
      <SuccessBanner timeout={5000} onDismissed={onDismissed}>
        选择性提交未完成。已从 <strong>{targetBranchName}</strong> 中移除{' '}
        {countCherryPicked}
        {' 个复制的提交'}。
      </SuccessBanner>
    )
  }
}
