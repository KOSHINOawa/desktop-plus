import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { PopupType } from '../../models/popup'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { SuggestedAction } from '../suggested-actions'
import { SuggestedActionGroup } from '../suggested-actions'

const ClappingHandsImage = encodePathAsUrl(
  __dirname,
  'static/admin-mentoring.svg'
)

const TelescopeOcticon = <Octicon symbol={octicons.telescope} />
const PlusOcticon = <Octicon symbol={octicons.plus} />
const FileDirectoryOcticon = <Octicon symbol={octicons.fileDirectory} />

interface ITutorialDoneProps {
  readonly dispatcher: Dispatcher

  /**
   * The currently selected repository
   */
  readonly repository: Repository

  /**
   * If this has not happened, the tuturial completion header will be focused so
   * that it can be read by screen readers. The purpose of tracking this is so
   * the focus does not repeatedly get moved to this header if user is navigating
   * between repositories or history and changes view after completing the tutorial.
   */
  readonly tutorialCompletionAnnounced: boolean

  /**
   * Called when the tutorial completion header has been focused and read by
   * screen readers
   */
  readonly onTutorialCompletionAnnounced: () => void
}

export class TutorialDone extends React.Component<ITutorialDoneProps, {}> {
  private header = React.createRef<HTMLHeadingElement>()

  public componentDidMount() {
    if (this.header.current && !this.props.tutorialCompletionAnnounced) {
      // Add the header into the tab order so that it can be focused
      this.header.current.tabIndex = 0
      this.header.current?.focus()
      this.props.onTutorialCompletionAnnounced()
      this.header.current.tabIndex = -1
    }
  }

  public render() {
    return (
      <div id="tutorial-done">
        <div className="content">
          <div className="header">
            <div className="text">
              <h1 ref={this.header}>你已完成！</h1>
              <p>
                你已经了解了如何使用 Desktop Plus 的基础。以下是一些后续建议。
              </p>
            </div>
            <img src={ClappingHandsImage} className="image" alt="鼓掌的双手" />
          </div>
          <SuggestedActionGroup>
            <SuggestedAction
              title="在 GitHub 上探索项目"
              description="为你感兴趣的项目做出贡献"
              buttonText={__DARWIN__ ? '在浏览器中打开' : '在浏览器中打开'}
              icon={octicons.browser}
              onClick={this.openDotcomExplore}
              type="normal"
              image={TelescopeOcticon}
            />
            <SuggestedAction
              title="创建新的仓库"
              description="开始一个全新的项目"
              buttonText={__DARWIN__ ? '创建仓库' : '创建仓库'}
              icon={octicons.repo}
              onClick={this.onCreateNewRepository}
              type="normal"
              image={PlusOcticon}
            />
            <SuggestedAction
              title="添加本地仓库"
              description="在 Desktop Plus 中处理现有项目"
              buttonText={__DARWIN__ ? '添加仓库' : '添加仓库'}
              icon={octicons.fileDirectory}
              onClick={this.onAddExistingRepository}
              type="normal"
              image={FileDirectoryOcticon}
            />
          </SuggestedActionGroup>
        </div>
      </div>
    )
  }

  private openDotcomExplore = () => {
    this.props.dispatcher.showGitHubExplore(this.props.repository)
  }

  private onCreateNewRepository = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.CreateRepository,
    })
  }

  private onAddExistingRepository = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.AddRepository,
    })
  }
}
