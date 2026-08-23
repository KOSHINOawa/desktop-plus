import * as React from 'react'

import { HistoryTabMode } from '../../lib/app-state'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dispatcher } from '../dispatcher'
import { ActionStatusIcon } from '../lib/action-status-icon'
import { MergeTreeResult } from '../../models/merge'
import { ComputedAction } from '../../models/computed-action'
import {
  DropdownSelectButton,
  IDropdownSelectButtonOption,
} from '../dropdown-select-button'
import { getMergeOptions, updateRebasePreview } from '../lib/update-branch'
import {
  MultiCommitOperationKind,
  isIdMultiCommitOperation,
} from '../../models/multi-commit-operation'
import { RebasePreview } from '../../models/rebase'

interface IMergeCallToActionWithConflictsProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly mergeStatus: MergeTreeResult | null
  readonly currentBranch: Branch
  readonly comparisonBranch: Branch
  readonly commitsBehind: number
}

interface IMergeCallToActionWithConflictsState {
  readonly selectedOperation: MultiCommitOperationKind
  readonly rebasePreview: RebasePreview | null
}

export class MergeCallToActionWithConflicts extends React.Component<
  IMergeCallToActionWithConflictsProps,
  IMergeCallToActionWithConflictsState
> {
  /**
   * This is obtained by either the merge status or the rebase preview. Depending
   * on which option is selected in the dropdown.
   */
  private get computedAction(): ComputedAction | null {
    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return this.state.rebasePreview !== null
        ? this.state.rebasePreview.kind
        : null
    }
    return this.props.mergeStatus !== null ? this.props.mergeStatus.kind : null
  }

  /**
   * This is obtained by either the merge status or the rebase preview. Depending
   * on which option is selected in the dropdown.
   */
  private get commitCount(): number {
    const { selectedOperation, rebasePreview } = this.state
    if (selectedOperation === MultiCommitOperationKind.Rebase) {
      return rebasePreview !== null &&
        rebasePreview.kind === ComputedAction.Clean
        ? rebasePreview.commitsAhead.length
        : 0
    }

    return this.props.commitsBehind
  }

  public constructor(props: IMergeCallToActionWithConflictsProps) {
    super(props)

    this.state = {
      selectedOperation: MultiCommitOperationKind.Merge,
      rebasePreview: null,
    }
  }

  private isUpdateBranchDisabled(): boolean {
    if (this.commitCount <= 0) {
      return true
    }

    const { selectedOperation, rebasePreview } = this.state
    if (selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        rebasePreview === null || rebasePreview.kind !== ComputedAction.Clean
      )
    }

    return (
      this.props.mergeStatus != null &&
      this.props.mergeStatus.kind === ComputedAction.Invalid
    )
  }

  private updateRebasePreview = async (baseBranch: Branch) => {
    const { currentBranch: targetBranch, repository } = this.props
    updateRebasePreview(baseBranch, targetBranch, repository, rebasePreview => {
      this.setState({ rebasePreview })
    })
  }

  private onOperationChange = (option: IDropdownSelectButtonOption) => {
    if (!isIdMultiCommitOperation(option.id)) {
      return
    }

    this.setState({ selectedOperation: option.id })
    if (option.id === MultiCommitOperationKind.Rebase) {
      this.updateRebasePreview(this.props.comparisonBranch)
    }
  }

  private onOperationInvoked = async (
    event: React.MouseEvent<HTMLButtonElement>,
    selectedOption: IDropdownSelectButtonOption
  ) => {
    if (!isIdMultiCommitOperation(selectedOption.id)) {
      return
    }
    event.preventDefault()

    const { dispatcher, repository } = this.props

    await this.dispatchOperation(selectedOption.id)

    // TODO - search: make sure this switches to the history tab
    dispatcher.executeCompare(repository, {
      kind: HistoryTabMode.History,
    })

    dispatcher.updateCompareForm(repository, {
      showBranchList: false,
      filterText: '',
    })
  }

  private async dispatchOperation(
    operation: MultiCommitOperationKind
  ): Promise<void> {
    const {
      dispatcher,
      currentBranch,
      comparisonBranch,
      repository,
      mergeStatus,
    } = this.props

    if (operation === MultiCommitOperationKind.Rebase) {
      const commits =
        this.state.rebasePreview !== null &&
        this.state.rebasePreview.kind === ComputedAction.Clean
          ? this.state.rebasePreview.commitsAhead
          : []
      return dispatcher.startRebase(
        repository,
        comparisonBranch,
        currentBranch,
        commits
      )
    }

    const isSquash = operation === MultiCommitOperationKind.Squash
    dispatcher.initializeMultiCommitOperation(
      repository,
      {
        kind: MultiCommitOperationKind.Merge,
        isSquash,
        sourceBranch: comparisonBranch,
      },
      currentBranch,
      [],
      currentBranch.tip.sha
    )
    dispatcher.incrementMetric('mergesInitiatedFromComparison')

    return dispatcher.mergeBranch(
      repository,
      comparisonBranch,
      mergeStatus,
      isSquash
    )
  }

  public render() {
    const disabled = this.isUpdateBranchDisabled()
    const mergeDetails = this.commitCount > 0 ? this.renderMergeStatus() : null

    return (
      <div className="merge-cta">
        {mergeDetails}

        <DropdownSelectButton
          checkedOption={this.state.selectedOperation}
          options={getMergeOptions()}
          dropdownAriaLabel="合并选项"
          disabled={disabled}
          onCheckedOptionChange={this.onOperationChange}
          onSubmit={this.onOperationInvoked}
        />
      </div>
    )
  }

  private renderMergeStatus() {
    if (this.computedAction === null) {
      return null
    }

    return (
      <div className="merge-status-component">
        <ActionStatusIcon
          status={{ kind: this.computedAction }}
          classNamePrefix="merge-status"
        />

        {this.renderStatusDetails()}
      </div>
    )
  }

  private renderStatusDetails() {
    const { currentBranch, comparisonBranch, mergeStatus } = this.props
    const { selectedOperation } = this.state
    if (this.computedAction === null) {
      return null
    }
    switch (this.computedAction) {
      case ComputedAction.Loading:
        return this.renderLoadingMessage()
      case ComputedAction.Clean:
        return this.renderCleanMessage(currentBranch, comparisonBranch)
      case ComputedAction.Invalid:
        return this.renderInvalidMessage()
    }

    if (
      selectedOperation !== MultiCommitOperationKind.Rebase &&
      mergeStatus !== null &&
      mergeStatus.kind === ComputedAction.Conflicts
    ) {
      return this.renderConflictedMergeMessage(
        currentBranch,
        comparisonBranch,
        mergeStatus.conflictedFiles
      )
    }
    return null
  }

  private renderLoadingMessage() {
    const operationLabel =
      this.state.selectedOperation === MultiCommitOperationKind.Rebase
        ? '变基'
        : this.state.selectedOperation === MultiCommitOperationKind.Squash
        ? '压缩'
        : '合并'
    return (
      <div className="merge-message merge-message-loading">
        正在检查是否可以自动{operationLabel}…
      </div>
    )
  }

  private renderCleanMessage(currentBranch: Branch, branch: Branch) {
    if (this.commitCount <= 0) {
      return null
    }

    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        <div className="merge-message">
          这将通过把其
          <strong>{`${this.commitCount} 个提交`}</strong>
          {` 应用到 `}
          <strong>{branch.name}</strong>
          {` 之上来更新 `}
          <strong>{currentBranch.name}</strong>
        </div>
      )
    }

    return (
      <div className="merge-message">
        这将把
        <strong>{` ${this.commitCount} 个提交`}</strong>
        {` 从 `}
        <strong>{branch.name}</strong>
        {` 合并到 `}
        <strong>{currentBranch.name}</strong>
      </div>
    )
  }

  private renderInvalidMessage() {
    if (this.state.selectedOperation === MultiCommitOperationKind.Rebase) {
      return (
        <div className="merge-message">
          无法开始变基。请确认已选择有效的分支。
        </div>
      )
    }

    return (
      <div className="merge-message">
        无法合并此仓库中不相关的历史记录
      </div>
    )
  }

  private renderConflictedMergeMessage(
    currentBranch: Branch,
    branch: Branch,
    count: number
  ) {
    return (
      <div className="merge-message">
        将会有
        <strong>{` ${count} 个冲突文件`}</strong>
        {` 在把 `}
        <strong>{branch.name}</strong>
        {` 合并到 `}
        <strong>{currentBranch.name}</strong>
        {` 时产生`}
      </div>
    )
  }
}
