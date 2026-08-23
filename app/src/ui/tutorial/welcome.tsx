import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'

const CodeImage = encodePathAsUrl(__dirname, 'static/code.svg')
const TeamDiscussionImage = encodePathAsUrl(
  __dirname,
  'static/github-for-teams.svg'
)
const CloudServerImage = encodePathAsUrl(
  __dirname,
  'static/github-for-business.svg'
)

export class TutorialWelcome extends React.Component {
  public render() {
    return (
      <div id="tutorial-welcome">
        <div className="header">
          <h1>欢迎来到 Github Desktop！</h1>
          <p>使用此教程来熟悉 Git、GitHub 和 Github Desktop。</p>
        </div>
        <ul className="definitions">
          <li>
            <img src={CodeImage} alt="HTML 语法图标" />
            <p>
              <strong>Git</strong> 是一个版本控制系统。
            </p>
          </li>
          <li>
            <img src={TeamDiscussionImage} alt="头顶有讨论气泡的人" />
            <p>
              <strong>GitHub</strong> 是你存储代码并与他人协作的地方
            </p>
          </li>
          <li>
            <img src={CloudServerImage} alt="带有云的服务器堆栈" />
            <p>
              <strong>Desktop Plus</strong> 帮助你在本地使用 Github
            </p>
          </li>
        </ul>
      </div>
    )
  }
}
