import * as React from 'react'
import { Dialog, DialogFooter } from '../dialog'
import { TabBar } from '../tab-bar'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'
import { CommitList } from './commit-list'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { Emoji } from '../../lib/emoji'
import { Dispatcher } from '../dispatcher'

export enum UnreachableCommitsTab {
  Unreachable,
  Reachable,
}

interface IUnreachableCommitsDialogProps {
  /** The dispatcher to use. */
  readonly dispatcher: Dispatcher

  /** The shas of the currently selected commits */
  readonly selectedShas: ReadonlyArray<string>

  /** The shas of the commits showed in the diff */
  readonly shasInDiff: ReadonlyArray<string>

  /** The commits loaded, keyed by their full SHA. */
  readonly commitLookup: Map<string, Commit>

  /** Used to set the selected tab. */
  readonly selectedTab: UnreachableCommitsTab

  /** The emoji lookup to render images inline */
  readonly emoji: Map<string, Emoji>

  /** Called to dismiss the  */
  readonly onDismissed: () => void

  readonly accounts: ReadonlyArray<Account>

  readonly preferAbsoluteDates: boolean
}

interface IUnreachableCommitsDialogState {
  /** The currently select tab. */
  readonly selectedTab: UnreachableCommitsTab

  /** The currently selected sha in the list */
  readonly selectedSHAs: ReadonlyArray<string>
}

/** The component for for viewing the unreachable commits in the current diff a repository. */
export class UnreachableCommitsDialog extends React.Component<
  IUnreachableCommitsDialogProps,
  IUnreachableCommitsDialogState
> {
  public constructor(props: IUnreachableCommitsDialogProps) {
    super(props)

    this.state = {
      selectedTab: props.selectedTab,
      selectedSHAs: [],
    }
  }

  public componentWillUpdate(nextProps: IUnreachableCommitsDialogProps) {
    const currentSelectedTab = this.props.selectedTab
    const selectedTab = nextProps.selectedTab

    if (currentSelectedTab !== selectedTab) {
      this.setState({ selectedTab })
    }
  }

  private onTabClicked = (selectedTab: UnreachableCommitsTab) => {
    this.setState({ selectedTab })
  }

  private getShasToDisplay = () => {
    const { selectedTab } = this.state
    const { shasInDiff, selectedShas } = this.props
    if (selectedTab === UnreachableCommitsTab.Reachable) {
      return shasInDiff
    }

    return selectedShas.filter(sha => !shasInDiff.includes(sha))
  }

  private onCommitsSelected = (
    commits: ReadonlyArray<Commit>,
    isContiguous: boolean
  ) => {
    this.setState({ selectedSHAs: commits.map(c => c.sha) })
  }

  private renderTabs() {
    return (
      <TabBar
        onTabClicked={this.onTabClicked}
        selectedIndex={this.state.selectedTab}
      >
        <span>不可达</span>
        <span>可达</span>
      </TabBar>
    )
  }

  private renderActiveTab() {
    const { commitLookup, emoji } = this.props

    return (
      <>
        {this.renderUnreachableCommitsMessage()}
        <div className="unreachable-commit-list">
          <CommitList
            repository={null}
            dispatcher={this.props.dispatcher}
            isLocalRepository={true}
            commitLookup={commitLookup}
            commitSHAs={this.getShasToDisplay()}
            selectedSHAs={this.state.selectedSHAs}
            localCommitSHAs={[]}
            emoji={emoji}
            onCommitsSelected={this.onCommitsSelected}
            accounts={this.props.accounts}
            showConventionalCommitBadges={false}
            isInformationalView={true}
            preferAbsoluteDates={this.props.preferAbsoluteDates}
          />
        </div>
      </>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup cancelButtonVisible={false} />
      </DialogFooter>
    )
  }

  private renderUnreachableCommitsMessage = () => {
    const count = this.getShasToDisplay().length
    const unreachable =
      this.state.selectedTab === UnreachableCommitsTab.Unreachable
    return (
      <div className="message">
        您{unreachable ? '不会' : '会'}看到来自以下提交（共 {count}{' '}
        个）的更改，因为
        {unreachable ? '它们不' : '它们'}在您所选最新提交的祖先路径中。
        <LinkButton uri="https://github.com/desktop/desktop/blob/development/docs/learn-more/unreachable-commits.md">
          了解有关不可达提交的更多信息。
        </LinkButton>
      </div>
    )
  }

  public render() {
    return (
      <Dialog
        className="unreachable-commits"
        title={__DARWIN__ ? '提交可达性' : '提交可达性'}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderTabs()}
        {this.renderActiveTab()}
        {this.renderFooter()}
      </Dialog>
    )
  }
}
