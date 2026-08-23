import { Menu, shell, BrowserWindow } from 'electron'
import { ensureItemIds } from './ensure-item-ids'
import { MenuEvent } from './menu-event'
import { truncateWithEllipsis } from '../../lib/truncate-with-ellipsis'
import { getLogDirectoryPath } from '../../lib/logging/get-log-path'
import { UNSAFE_openDirectory } from '../shell'
import { enableWorktreeSupport } from '../../lib/feature-flag'
import { MenuLabelsEvent } from '../../models/menu-labels'
import { RepoType } from '../../models/github-repository'
import * as ipcWebContents from '../ipc-webcontents'
import { mkdir } from 'fs/promises'
import { buildTestMenu } from './build-test-menu'
import { assertNever } from '../../lib/fatal-error'
import { getForgejoName } from '../../lib/forgejo-name'

const createPullRequestLabel = __DARWIN__
  ? '创建拉取请求'
  : '创建&拉取请求'
const defaultBranchNameValue = __DARWIN__ ? '默认分支' : '默认分支'
const confirmRepositoryRemovalLabel = __DARWIN__ ? '移除…' : '&移除…'
const repositoryRemovalLabel = __DARWIN__ ? '移除' : '&移除'
const confirmStashAllChangesLabel = __DARWIN__
  ? '暂存所有更改…'
  : '&暂存所有更改…'
const stashAllChangesLabel = __DARWIN__
  ? '暂存所有更改'
  : '&暂存所有更改'

enum ZoomDirection {
  Reset,
  In,
  Out,
}

export const separator: Electron.MenuItemConstructorOptions = {
  type: 'separator',
}

export function buildDefaultMenu(params: MenuLabelsEvent): Electron.Menu {
  return Menu.buildFromTemplate(buildDefaultMenuTemplate(params))
}

export function buildDefaultMenuTemplate({
  selectedExternalEditor,
  selectedShell,
  askForConfirmationOnForcePush,
  askForConfirmationOnRepositoryRemoval,
  hasCurrentPullRequest = false,
  contributionTargetDefaultBranch = defaultBranchNameValue,
  isForcePushForCurrentRepository = false,
  isStashedChangesVisible = false,
  askForConfirmationWhenStashingAllChanges = true,
  gitHubRepositoryType,
  gitHubRepositoryEndpoint,
  isChangesFilterVisible = true,
}: MenuLabelsEvent): Electron.MenuItemConstructorOptions[] {
  contributionTargetDefaultBranch = truncateWithEllipsis(
    contributionTargetDefaultBranch,
    25
  )

  const removeRepoLabel = askForConfirmationOnRepositoryRemoval
    ? confirmRepositoryRemovalLabel
    : repositoryRemovalLabel

  const showPullRequestLabel = __DARWIN__
    ? `在 ${onGithubLabel(gitHubRepositoryType, gitHubRepositoryEndpoint)} 上查看拉取请求`
    : `在 ${onGithubLabel(
        gitHubRepositoryType,
        gitHubRepositoryEndpoint
      )} 上&查看拉取请求`

  const pullRequestLabel = hasCurrentPullRequest
    ? showPullRequestLabel
    : createPullRequestLabel

  const template = new Array<Electron.MenuItemConstructorOptions>()

  if (__DARWIN__) {
    template.push({
      label: 'Desktop Plus',
      submenu: [
        {
          label: '关于 Desktop Plus',
          click: emit('show-about'),
          id: 'about',
        },
        separator,
        {
          label: '设置…',
          id: 'preferences',
          accelerator: 'CmdOrCtrl+,',
          click: emit('show-preferences'),
        },
        {
          label: '仓库选项…',
          id: 'repository-preferences',
          accelerator: 'CmdOrCtrl+Shift+,',
          click: emit('show-repository-preferences'),
        },
        separator,
        {
          label: '安装命令行工具…',
          id: 'install-cli',
          click: emit('install-darwin-cli'),
        },
        separator,
        {
          role: 'services',
          submenu: [],
        },
        separator,
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        separator,
        { role: 'quit' },
      ],
    })
  }

  const fileMenu: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__ ? '文件' : '&文件',
    submenu: [
      {
        label: __DARWIN__ ? '新建仓库…' : '新建&仓库…',
        id: 'new-repository',
        click: emit('create-repository'),
        accelerator: 'CmdOrCtrl+N',
      },
      {
        label: __DARWIN__ ? '打开新窗口' : '打开新窗口',
        id: 'new-window',
        click: emit('open-new-window'),
        accelerator: 'CmdOrCtrl+Alt+N',
      },
      separator,
      {
        label: __DARWIN__ ? '添加本地仓库…' : '添加&本地仓库…',
        id: 'add-local-repository',
        accelerator: 'CmdOrCtrl+O',
        click: emit('add-local-repository'),
      },
      {
        label: __DARWIN__ ? '克隆仓库…' : '&克隆仓库…',
        id: 'clone-repository',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: emit('clone-repository'),
      },
    ],
  }

  if (!__DARWIN__) {
    const fileItems = fileMenu.submenu as Electron.MenuItemConstructorOptions[]
    const exitAccelerator = __WIN32__ ? 'Alt+F4' : 'CmdOrCtrl+Q'

    fileItems.push(
      separator,
      {
        label: '&选项…',
        id: 'preferences',
        accelerator: 'CmdOrCtrl+,',
        click: emit('show-preferences'),
      },
      {
        label: '仓库选项…',
        id: 'repository-preferences',
        accelerator: 'CmdOrCtrl+Shift+,',
        click: emit('show-repository-preferences'),
      },
      separator,
      {
        role: 'quit',
        label: '退&出',
        accelerator: exitAccelerator,
      }
    )
  }

  template.push(fileMenu)

  template.push({
    label: __DARWIN__ ? '编辑' : '&编辑',
    submenu: [
      { role: 'undo', label: __DARWIN__ ? '撤销' : '&撤销' },
      { role: 'redo', label: __DARWIN__ ? '重做' : '&重做' },
      separator,
      { role: 'cut', label: __DARWIN__ ? '剪切' : '剪&切' },
      { role: 'copy', label: __DARWIN__ ? '复制' : '&复制' },
      { role: 'paste', label: __DARWIN__ ? '粘贴' : '&粘贴' },
      {
        label: __DARWIN__ ? '全选' : '全&选',
        accelerator: 'CmdOrCtrl+A',
        click: emit('select-all'),
      },
      separator,
      {
        id: 'find',
        label: __DARWIN__ ? '查找' : '&查找',
        accelerator: 'CmdOrCtrl+F',
        click: emit('find-text'),
      },
    ],
  })

  template.push({
    label: __DARWIN__ ? '查看' : '&查看',
    submenu: [
      {
        label: __DARWIN__ ? '显示更改' : '&更改',
        id: 'show-changes',
        accelerator: 'CmdOrCtrl+1',
        click: emit('show-changes'),
      },
      {
        label: __DARWIN__ ? '显示历史记录' : '&历史记录',
        id: 'show-history',
        accelerator: 'CmdOrCtrl+2',
        click: emit('show-history'),
      },
      {
        label: __DARWIN__ ? '显示比较' : '比较',
        id: 'show-compare',
        accelerator: 'CmdOrCtrl+3',
        click: emit('show-compare'),
      },
      {
        label: __DARWIN__ ? '显示仓库列表' : '仓库&列表',
        id: 'show-repository-list',
        accelerator: 'CmdOrCtrl+T',
        click: emit('choose-repository'),
      },
      {
        label: __DARWIN__ ? '显示分支列表' : '&分支列表',
        id: 'show-branches-list',
        accelerator: 'CmdOrCtrl+B',
        click: emit('show-branches'),
      },
      {
        label: __DARWIN__ ? '显示工作树列表' : '工作&树列表',
        id: 'show-worktrees-list',
        accelerator: 'CmdOrCtrl+Alt+W',
        click: emit('show-worktrees'),
        visible: enableWorktreeSupport(),
      },
      separator,
      {
        label: __DARWIN__ ? '转到摘要' : '转到&摘要',
        id: 'go-to-commit-message',
        accelerator: 'CmdOrCtrl+G',
        click: emit('go-to-commit-message'),
      },
      {
        label: getStashedChangesLabel(isStashedChangesVisible),
        id: 'toggle-stashed-changes',
        accelerator: 'Ctrl+H',
        click: isStashedChangesVisible
          ? emit('hide-stashed-changes')
          : emit('show-stashed-changes'),
      },
      {
        label: __DARWIN__
          ? `${isChangesFilterVisible ? '隐藏' : '显示'}更改筛选`
          : `${
              isChangesFilterVisible ? '隐藏' : '显示'
            }切换更改&筛选`,
        id: 'toggle-changes-filter',
        accelerator: 'CmdOrCtrl+L',
        click: emit('toggle-changes-filter'),
      },
      {
        label: __DARWIN__ ? '切换全屏' : '切换&全屏',
        role: 'togglefullscreen',
      },
      separator,
      {
        label: __DARWIN__ ? '重置缩放' : '重置缩放',
        accelerator: 'CmdOrCtrl+0',
        click: zoom(ZoomDirection.Reset),
      },
      {
        label: __DARWIN__ ? '放大' : '放大',
        accelerator: 'CmdOrCtrl+=',
        click: zoom(ZoomDirection.In),
      },
      {
        label: __DARWIN__ ? '缩小' : '缩小',
        accelerator: 'CmdOrCtrl+-',
        click: zoom(ZoomDirection.Out),
      },
      {
        label: __DARWIN__
          ? '展开活动可调整区域'
          : '展开活动可调整区域',
        id: 'increase-active-resizable-width',
        accelerator: 'CmdOrCtrl+9',
        click: emit('increase-active-resizable-width'),
      },
      {
        label: __DARWIN__
          ? '收起活动可调整区域'
          : '收起活动可调整区域',
        id: 'decrease-active-resizable-width',
        accelerator: 'CmdOrCtrl+8',
        click: emit('decrease-active-resizable-width'),
      },
      separator,
      {
        label: '&重新加载',
        id: 'reload-window',
        // Ctrl+Alt is interpreted as AltGr on international keyboards and this
        // can clash with other shortcuts. We should always use Ctrl+Shift for
        // chorded shortcuts, but this menu item is not a user-facing feature
        // so we are going to keep this one around.
        accelerator: 'CmdOrCtrl+Alt+R',
        click(item: any, focusedWindow: Electron.BaseWindow | undefined) {
          if (focusedWindow instanceof BrowserWindow) {
            focusedWindow.reload()
          }
        },
        visible: __RELEASE_CHANNEL__ === 'development',
      },
      {
        id: 'show-devtools',
        label: __DARWIN__
          ? '切换开发者工具'
          : '&切换开发者工具',
        accelerator: (() => {
          return __DARWIN__ ? 'Alt+Command+I' : 'Ctrl+Shift+I'
        })(),
        click(item: any, focusedWindow: Electron.BaseWindow | undefined) {
          if (focusedWindow instanceof BrowserWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        },
      },
    ],
  })

  const pushLabel = getPushLabel(
    isForcePushForCurrentRepository,
    askForConfirmationOnForcePush
  )

  const pushEventType = isForcePushForCurrentRepository ? 'force-push' : 'push'

  template.push({
    label: __DARWIN__ ? '仓库' : '&仓库',
    id: 'repository',
    submenu: [
      {
        id: 'push',
        label: pushLabel,
        accelerator: 'CmdOrCtrl+P',
        click: emit(pushEventType),
      },
      {
        id: 'pull',
        label: __DARWIN__ ? '拉取' : '拉&取',
        accelerator: 'CmdOrCtrl+Shift+P',
        click: emit('pull'),
      },
      {
        id: 'fetch',
        label: __DARWIN__ ? '抓取' : '&抓取',
        accelerator: 'CmdOrCtrl+Shift+T',
        click: emit('fetch'),
      },
      {
        label: removeRepoLabel,
        id: 'remove-repository',
        accelerator: 'CmdOrCtrl+Backspace',
        click: emit('remove-repository'),
      },
      separator,
      {
        id: 'view-repository-on-github',
        label: __DARWIN__
          ? `在 ${onGithubLabel(
              gitHubRepositoryType,
              gitHubRepositoryEndpoint
            )} 上查看仓库`
          : `在 ${onGithubLabel(
              gitHubRepositoryType,
              gitHubRepositoryEndpoint
            )} 上&查看仓库`,
        accelerator: 'CmdOrCtrl+Shift+G',
        click: emit('view-repository-on-github'),
      },
      {
        label: __DARWIN__
          ? `在 ${selectedShell ?? 'Shell'} 中打开`
          : `在 ${selectedShell ?? 'Shell'} 中&打开`,
        id: 'open-in-shell',
        accelerator: 'Ctrl+`',
        click: emit('open-in-shell'),
      },
      {
        label: __DARWIN__
          ? '在访达中显示'
          : __WIN32__
          ? '在文件资源管理器中&显示'
          : '在你的文件管理器中&显示',
        id: 'open-working-directory',
        accelerator: 'CmdOrCtrl+Shift+F',
        click: emit('open-working-directory'),
      },
      {
        label: __DARWIN__
          ? `在 ${selectedExternalEditor ?? 'External Editor'} 中打开`
          : `在 ${selectedExternalEditor ?? 'External Editor'} 中打&开`,
        id: 'open-external-editor',
        accelerator: 'CmdOrCtrl+Shift+A',
        click: emit('open-external-editor'),
      },
      {
        label: __DARWIN__ ? '打开方式…' : '打开&方式…',
        id: 'open-with-external-editor',
        accelerator: 'CmdOrCtrl+Shift+Alt+A',
        click: emit('open-with-external-editor'),
      },
      separator,
      {
        id: 'create-issue-in-repository-on-github',
        label: __DARWIN__
          ? `在 ${onGithubLabel(
              gitHubRepositoryType,
              gitHubRepositoryEndpoint
            )} 上创建议题`
          : `在 ${onGithubLabel(
              gitHubRepositoryType,
              gitHubRepositoryEndpoint
            )} 上&创建议题`,
        accelerator: 'CmdOrCtrl+I',
        click: emit('create-issue-in-repository-on-github'),
      },
      separator,
      {
        id: 'create-worktree',
        label: __DARWIN__ ? '新建工作树…' : '新建工作&树…',
        click: emit('create-worktree'),
        accelerator: 'CmdOrCtrl+Shift+W',
        visible: enableWorktreeSupport(),
      },
      ...(enableWorktreeSupport() ? [separator] : []),
      {
        label: __DARWIN__ ? '仓库设置…' : '仓库&设置…',
        id: 'show-repository-settings',
        click: emit('show-repository-settings'),
      },
      {
        id: 'manage-remotes',
        label: __DARWIN__ ? '管理远程…' : '管理远程…',
        click: emit('manage-remotes'),
      },
    ],
  })

  const branchSubmenu = [
    {
      label: __DARWIN__ ? '新建分支…' : '新建&分支…',
      id: 'create-branch',
      accelerator: 'CmdOrCtrl+Shift+N',
      click: emit('create-branch'),
    },
    {
      label: __DARWIN__ ? '重命名…' : '&重命名…',
      id: 'rename-branch',
      accelerator: 'CmdOrCtrl+Shift+R',
      click: emit('rename-branch'),
    },
    {
      label: __DARWIN__ ? '删除…' : '&删除…',
      id: 'delete-branch',
      accelerator: 'CmdOrCtrl+Shift+D',
      click: emit('delete-branch'),
    },
    separator,
    {
      label: __DARWIN__ ? '丢弃所有更改…' : '丢弃所有更改…',
      id: 'discard-all-changes',
      accelerator: 'CmdOrCtrl+Shift+Backspace',
      click: emit('discard-all-changes'),
    },
    {
      label: __DARWIN__
        ? '永久丢弃所有更改…'
        : '永久丢弃所有更改…',
      id: 'permanently-discard-all-changes',
      click: emit('permanently-discard-all-changes'),
    },
    {
      label: askForConfirmationWhenStashingAllChanges
        ? confirmStashAllChangesLabel
        : stashAllChangesLabel,
      id: 'stash-all-changes',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: emit('stash-all-changes'),
    },
    separator,
    {
      label: __DARWIN__
        ? `从 ${contributionTargetDefaultBranch} 更新`
        : `&从 ${contributionTargetDefaultBranch} 更新`,
      id: 'update-branch-with-contribution-target-branch',
      accelerator: 'CmdOrCtrl+Shift+U',
      click: emit('update-branch-with-contribution-target-branch'),
    },
    {
      label: __DARWIN__ ? '与分支比较' : '&与分支比较',
      id: 'compare-to-branch',
      accelerator: 'CmdOrCtrl+Shift+B',
      click: emit('compare-to-branch'),
    },
    {
      label: __DARWIN__
        ? '合并到当前分支…'
        : '&合并到当前分支…',
      id: 'merge-branch',
      accelerator: 'CmdOrCtrl+Shift+M',
      click: emit('merge-branch'),
    },
    {
      label: __DARWIN__
        ? '压缩合并到当前分支…'
        : '&压缩合并到当前分支…',
      id: 'squash-and-merge-branch',
      accelerator: 'CmdOrCtrl+Shift+H',
      click: emit('squash-and-merge-branch'),
    },
    {
      label: __DARWIN__ ? '将当前分支变基…' : '&将当前分支变基…',
      id: 'rebase-branch',
      accelerator: 'CmdOrCtrl+Shift+E',
      click: emit('rebase-branch'),
    },
    separator,
    {
      label: `在 ${onGithubLabel(
        gitHubRepositoryType,
        gitHubRepositoryEndpoint
      )} 上比较`,
      id: 'compare-on-github',
      accelerator: 'CmdOrCtrl+Shift+C',
      click: emit('compare-on-github'),
    },
    {
      label: __DARWIN__
        ? `在 ${onGithubLabel(
            gitHubRepositoryType,
            gitHubRepositoryEndpoint
          )} 上查看分支`
        : `在 ${onGithubLabel(
            gitHubRepositoryType,
            gitHubRepositoryEndpoint
          )} 上查看分&支`,
        id: 'branch-on-github',
      accelerator: 'CmdOrCtrl+Alt+B',
      click: emit('branch-on-github'),
    },
  ]

  branchSubmenu.push({
    label: __DARWIN__ ? '预览拉取请求' : '预览拉取请求',
    id: 'preview-pull-request',
    accelerator: 'CmdOrCtrl+Alt+P',
    click: emit('preview-pull-request'),
  })

  branchSubmenu.push({
    label: pullRequestLabel,
    id: 'create-pull-request',
    accelerator: 'CmdOrCtrl+R',
    click: emit('open-pull-request'),
  })

  template.push({
    label: __DARWIN__ ? '分支' : '&分支',
    id: 'branch',
    submenu: branchSubmenu,
  })

  if (__DARWIN__) {
    template.push({
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
        separator,
        { role: 'front' },
      ],
    })
  }

  const submitIssueItem: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__ ? '报告问题…' : '报告问题…',
    click() {
      shell
        .openExternal(
          'https://github.com/desktop-plus/desktop-plus/issues/new/choose'
        )
        .catch(err => log.error('Failed opening issue creation page', err))
    },
  }

  const showUserGuides: Electron.MenuItemConstructorOptions = {
    label: '显示用户指南',
    click() {
      shell
        .openExternal('https://docs.github.com/en/desktop')
        .catch(err => log.error('Failed opening user guides page', err))
    },
  }

  const showKeyboardShortcuts: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__ ? '显示键盘快捷键' : '显示键盘快捷键',
    click() {
      shell
        .openExternal(
          'https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/keyboard-shortcuts'
        )
        .catch(err => log.error('Failed opening keyboard shortcuts page', err))
    },
  }

  const showLogsLabel = __DARWIN__
    ? '在访达中显示日志'
    : __WIN32__
    ? '在文件资源管理器中&显示日志'
    : '在你的文件管理器中&显示日志'

  const showLogsItem: Electron.MenuItemConstructorOptions = {
    label: showLogsLabel,
    click() {
      const logPath = getLogDirectoryPath()
      mkdir(logPath, { recursive: true })
        .then(() => UNSAFE_openDirectory(logPath))
        .catch(err => log.error('Failed opening logs directory', err))
    },
  }

  const helpItems = [
    submitIssueItem,
    showUserGuides,
    showKeyboardShortcuts,
    showLogsItem,
  ]

  helpItems.push(...buildTestMenu())

  if (__DARWIN__) {
    template.push({
      role: 'help',
      submenu: helpItems,
    })
  } else {
    template.push({
      label: '&帮助',
      submenu: [
        ...helpItems,
        separator,
        {
          label: '&关于 Desktop Plus',
          click: emit('show-about'),
          id: 'about',
        },
      ],
    })
  }

  ensureItemIds(template)

  return template
}

function getPushLabel(
  isForcePushForCurrentRepository: boolean,
  askForConfirmationOnForcePush: boolean
): string {
  if (!isForcePushForCurrentRepository) {
    return __DARWIN__ ? '推送' : '推&送'
  }

  if (askForConfirmationOnForcePush) {
    return __DARWIN__ ? '强制推送…' : '强制推&送…'
  }

  return __DARWIN__ ? '强制推送' : '强制推&送'
}

function getStashedChangesLabel(isStashedChangesVisible: boolean): string {
  if (isStashedChangesVisible) {
    return __DARWIN__ ? '隐藏暂存的更改' : '隐藏&暂存的更改'
  }

  return __DARWIN__ ? '显示暂存的更改' : '显示暂存的更改'
}

type ClickHandler = (
  menuItem: Electron.MenuItem,
  browserWindow: Electron.BaseWindow | undefined,
  event: Electron.KeyboardEvent
) => void

/**
 * Utility function returning a Click event handler which, when invoked, emits
 * the provided menu event over IPC.
 */
export function emit(name: MenuEvent): ClickHandler {
  return (_, focusedWindow) => {
    // focusedWindow can be null if the menu item was clicked without the window
    // being in focus. A simple way to reproduce this is to click on a menu item
    // while in DevTools. Since Desktop only supports one window at a time we
    // can be fairly certain that the first BrowserWindow we find is the one we
    // want.
    const window =
      focusedWindow instanceof BrowserWindow
        ? focusedWindow
        : BrowserWindow.getAllWindows()[0]
    if (window !== undefined) {
      ipcWebContents.send(window.webContents, 'menu-event', name)
    }
  }
}

/** The zoom steps that we support, these factors must sorted */
const ZoomInFactors = [0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]
const ZoomOutFactors = ZoomInFactors.slice().reverse()

/**
 * Returns the element in the array that's closest to the value parameter. Note
 * that this function will throw if passed an empty array.
 */
function findClosestValue(arr: Array<number>, value: number) {
  return arr.reduce((previous, current) => {
    return Math.abs(current - value) < Math.abs(previous - value)
      ? current
      : previous
  })
}

function onGithubLabel(
  gitHubRepositoryType: RepoType | null,
  endpoint: string | null
): string {
  switch (gitHubRepositoryType) {
    case 'github':
      return 'GitHub'
    case 'bitbucket':
      return 'Bitbucket'
    case 'gitlab':
      return 'GitLab'
    case 'forgejo':
      return getForgejoName(endpoint)
    case 'gitea':
      return 'Gitea'
    case null:
      return '你的浏览器'
    default:
      assertNever(gitHubRepositoryType, `Unknown type: ${gitHubRepositoryType}`)
  }
}

/**
 * Figure out the next zoom level for the given direction and alert the renderer
 * about a change in zoom factor if necessary.
 */
function zoom(direction: ZoomDirection): ClickHandler {
  return (menuItem, window) => {
    if (!(window instanceof BrowserWindow)) {
      return
    }

    const { webContents } = window

    if (direction === ZoomDirection.Reset) {
      webContents.zoomFactor = 1
      ipcWebContents.send(webContents, 'zoom-factor-changed', 1)
    } else {
      const rawZoom = webContents.zoomFactor
      const zoomFactors =
        direction === ZoomDirection.In ? ZoomInFactors : ZoomOutFactors

      // So the values that we get from zoomFactor property are floating point
      // precision numbers from chromium, that don't always round nicely, so
      // we'll have to do a little trick to figure out which of our supported
      // zoom factors the value is referring to.
      const currentZoom = findClosestValue(zoomFactors, rawZoom)

      const nextZoomLevel = zoomFactors.find(f =>
        direction === ZoomDirection.In ? f > currentZoom : f < currentZoom
      )

      // If we couldn't find a zoom level (likely due to manual manipulation
      // of the zoom factor in devtools) we'll just snap to the closest valid
      // factor we've got.
      const newZoom = nextZoomLevel === undefined ? currentZoom : nextZoomLevel

      webContents.zoomFactor = newZoom
      ipcWebContents.send(webContents, 'zoom-factor-changed', newZoom)
    }
  }
}
