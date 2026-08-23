import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { nameOf, Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { HighlightText } from '../lib/highlight-text'
import { match } from '../../lib/fuzzy-find'
import { AriaLiveContainer } from '../accessibility/aria-live-container'
import * as octicons from '../octicons/octicons.generated'

/**
 * Prefers the repo alias, otherwise falls back to the owner-qualified name
 */
const displayNameOf = (repository: Repository) =>
  repository.alias ?? nameOf(repository)

interface ICreateRepositoryGroupProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly repositories: ReadonlyArray<Repository>

  /** The ids of the repositories to preselect in the list, if any */
  readonly preselectedRepositoryIds?: ReadonlyArray<number>

  /**
   * The name of the existing custom group being edited. When set, the dialog
   * renames that group and unassigns the repositories that were part of it and
   * have been deselected.
   */
  readonly editedGroupName?: string
}

interface ICreateRepositoryGroupState {
  readonly groupName: string
  readonly selectedRepositoryIds: ReadonlySet<number>
  readonly filterText: string
}

interface IFilteredRepository {
  readonly repository: Repository

  /** Indices of the characters of the name that matched the filter */
  readonly matches: ReadonlyArray<number>
}

export class CreateRepositoryGroup extends React.Component<
  ICreateRepositoryGroupProps,
  ICreateRepositoryGroupState
> {
  public constructor(props: ICreateRepositoryGroupProps) {
    super(props)

    this.state = {
      groupName: props.editedGroupName ?? '',
      selectedRepositoryIds: new Set(props.preselectedRepositoryIds),
      filterText: '',
    }
  }

  public render() {
    const isEditing = this.props.editedGroupName !== undefined

    return (
      <Dialog
        id="create-repository-group"
        title={
          isEditing
            ? __DARWIN__
              ? '编辑组'
              : '编辑组'
            : __DARWIN__
            ? '新建组'
            : '新建组'
        }
        ariaDescribedBy="create-repository-group-description"
        onDismissed={this.props.onDismissed}
        onSubmit={this.createGroup}
      >
        <DialogContent>
          <p id="create-repository-group-description">
            {isEditing ? (
              <>
                为该组选择一个名称，并选择属于它的仓库。你取消选择的仓库将回到其自动分组。
              </>
            ) : (
              <>
                为新组选择一个名称，并选择要添加到其中的仓库。你可以稍后通过每个仓库的右键菜单更改此项。
              </>
            )}
          </p>
          <p>
            <TextBox
              ariaLabel="组名称"
              placeholder="组名称"
              value={this.state.groupName}
              onValueChanged={this.onGroupNameChanged}
              autoFocus={true}
            />
          </p>
          <p>
            <TextBox
              type="search"
              placeholder="筛选"
              ariaLabel="筛选仓库"
              prefixedIcon={octicons.search}
              value={this.state.filterText}
              onValueChanged={this.onFilterTextChanged}
              onKeyDown={this.onFilterKeyDown}
            />
          </p>
          {this.renderRepositoryList()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              isEditing
                ? __DARWIN__
                  ? '保存组'
                  : '保存组'
                : __DARWIN__
                ? '创建组'
                : '创建组'
            }
            okButtonDisabled={
              this.state.groupName.length === 0 ||
              this.state.selectedRepositoryIds.size === 0
            }
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderRepositoryList() {
    const repositories = this.sortRepositories(this.getFilteredRepositories())
    const resultCount = `${repositories.length} 个结果`

    return (
      <>
        <AriaLiveContainer
          message={resultCount}
          trackedUserInput={this.state.filterText}
        />
        {repositories.length === 0 ? (
          <div className="no-repositories">没有仓库匹配你的筛选条件。</div>
        ) : (
          <div
            className="repository-list-selector"
            role="group"
            aria-label="要添加到组的仓库"
          >
            {repositories.map(this.renderRepositoryCheckbox)}
          </div>
        )}
      </>
    )
  }

  private getFilteredRepositories(): ReadonlyArray<IFilteredRepository> {
    const filterText = this.state.filterText.trim()

    if (filterText.length === 0) {
      return this.props.repositories.map(repository => ({
        repository,
        matches: [],
      }))
    }

    return match(filterText, this.props.repositories, r => [
      displayNameOf(r),
    ]).map(({ item, matches }) => ({
      repository: item,
      matches: matches.title,
    }))
  }

  private sortRepositories(repositories: ReadonlyArray<IFilteredRepository>) {
    return repositories.toSorted((a, b) =>
      displayNameOf(a.repository).localeCompare(displayNameOf(b.repository))
    )
  }

  private onFilterTextChanged = (filterText: string) => {
    this.setState({ filterText })
  }

  private onFilterKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter in the filter field would otherwise submit the dialog and create
    // the group while the user is still narrowing down the list.
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }

  private renderRepositoryCheckbox = ({
    repository,
    matches,
  }: IFilteredRepository) => {
    const isSelected = this.state.selectedRepositoryIds.has(repository.id)

    return (
      <Checkbox
        key={repository.id}
        label={
          <HighlightText text={displayNameOf(repository)} highlight={matches} />
        }
        value={isSelected ? CheckboxValue.On : CheckboxValue.Off}
        onChange={this.onRepositoryCheckboxChange(repository.id)}
      />
    )
  }

  private onRepositoryCheckboxChange =
    (repositoryId: number) => (event: React.FormEvent<HTMLInputElement>) => {
      const selectedRepositoryIds = new Set(this.state.selectedRepositoryIds)

      if (event.currentTarget.checked) {
        selectedRepositoryIds.add(repositoryId)
      } else {
        selectedRepositoryIds.delete(repositoryId)
      }

      this.setState({ selectedRepositoryIds })
    }

  private onGroupNameChanged = (groupName: string) => {
    this.setState({ groupName })
  }

  private createGroup = async () => {
    const { dispatcher, repositories, editedGroupName } = this.props
    const { groupName, selectedRepositoryIds } = this.state

    const selectedRepositories = repositories.filter(r =>
      selectedRepositoryIds.has(r.id)
    )

    // Repositories removed from the group being edited go back to having no
    // group name, otherwise they'd stay in a group the user just left them out
    // of.
    const removedRepositories = repositories.filter(
      r =>
        editedGroupName !== undefined &&
        r.groupName === editedGroupName &&
        !selectedRepositoryIds.has(r.id)
    )

    await dispatcher.changeRepositoriesGroupName(
      selectedRepositories,
      groupName
    )

    if (removedRepositories.length > 0) {
      await dispatcher.changeRepositoriesGroupName(removedRepositories, null)
    }

    this.props.onDismissed()
  }
}
