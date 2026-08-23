import React from 'react'
import { Button } from '../lib/button'
import { Octicon, syncClockwise } from '../octicons'
import {
  DropdownItem,
  DropdownItemClassName,
  DropdownItemType,
  forcePushIcon,
  resetAndPullIcon,
} from './push-pull-button'

interface IPushPullButtonDropDownProps {
  readonly itemTypes: ReadonlyArray<DropdownItemType>
  /** The name of the remote. */
  readonly remoteName: string | null

  /** Will the app prompt the user to confirm a force push? */
  readonly askForConfirmationOnForcePush: boolean

  readonly fetch: () => void
  readonly forcePushWithLease: () => void
  readonly resetAndPull: () => void
}

export class PushPullButtonDropDown extends React.Component<IPushPullButtonDropDownProps> {
  private buttonsContainerRef: HTMLDivElement | null = null

  public componentDidMount() {
    window.addEventListener('keydown', this.onDropdownKeyDown)
  }

  public componentWillUnmount() {
    window.removeEventListener('keydown', this.onDropdownKeyDown)
  }

  private onButtonsContainerRef = (ref: HTMLDivElement | null) => {
    this.buttonsContainerRef = ref
  }

  private onDropdownKeyDown = (event: KeyboardEvent) => {
    // Allow using Up and Down arrow keys to navigate the dropdown items
    // (equivalent to Tab and Shift+Tab)
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()
    const items = this.buttonsContainerRef?.querySelectorAll<HTMLElement>(
      `.${DropdownItemClassName}`
    )

    if (items === undefined) {
      return
    }

    const focusedItem =
      this.buttonsContainerRef?.querySelector<HTMLElement>(':focus')
    if (!focusedItem) {
      return
    }

    const focusedIndex = Array.from(items).indexOf(focusedItem)
    const nextIndex =
      event.key === 'ArrowDown' ? focusedIndex + 1 : focusedIndex - 1
    // http://javascript.about.com/od/problemsolving/a/modulobug.htm
    const nextItem = items[(nextIndex + items.length) % items.length]
    nextItem?.focus()
  }

  private getDropdownItemWithType(type: DropdownItemType): DropdownItem {
    const { remoteName } = this.props

    switch (type) {
      case DropdownItemType.Fetch:
        return {
          title: `抓取 ${remoteName}`,
          description: `从 ${remoteName} 抓取最新更改`,
          action: this.props.fetch,
          icon: syncClockwise,
        }
      case DropdownItemType.ForcePush: {
        const forcePushWarning = this.props
          .askForConfirmationOnForcePush ? null : (
          <div className="warning">
            <span className="warning-title">警告：</span> 强制推送会重写远程上的
            历史记录。任何在此分支上协作的人员都需要将他们自己的本地分支重置为
            与远程历史记录一致。
          </div>
        )
        return {
          title: `强制推送 ${remoteName}`,
          description: (
            <>
              用你的本地更改覆盖 {remoteName} 上的任何更改
              {forcePushWarning}
            </>
          ),
          action: this.props.forcePushWithLease,
          icon: forcePushIcon,
        }
      }
      case DropdownItemType.ResetAndPull:
        return {
          title: '重置并拉取',
          description: (
            <>
              丢弃你的本地提交并从 {remoteName} 拉取
              <div className="warning">
                <span className="warning-title">警告：</span> 这将
                永久丢弃你在此分支上的本地提交。
              </div>
            </>
          ),
          action: this.props.resetAndPull,
          icon: resetAndPullIcon,
        }
    }
  }

  public renderDropdownItem = (type: DropdownItemType) => {
    const item = this.getDropdownItemWithType(type)
    return (
      <Button
        className={DropdownItemClassName}
        key={type}
        onClick={item.action}
      >
        <Octicon symbol={item.icon} />
        <div className="text-container">
          <div className="title">{item.title}</div>
          <div className="detail">{item.description}</div>
        </div>
      </Button>
    )
  }

  public render() {
    const { itemTypes } = this.props
    return (
      <div className="push-pull-dropdown" ref={this.onButtonsContainerRef}>
        {itemTypes.map(this.renderDropdownItem)}
      </div>
    )
  }
}
