import * as React from 'react'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'

interface ITermsAndConditionsProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
}

const contact = 'https://github.com/contact'
const logos = 'https://github.com/logos'
const privacyStatement =
  'https://help.github.com/articles/github-privacy-statement/'
const license = 'https://creativecommons.org/licenses/by/4.0/'

export class TermsAndConditions extends React.Component<
  ITermsAndConditionsProps,
  {}
> {
  public render() {
    return (
      <Dialog
        id="terms-and-conditions"
        title="GitHub 开源应用程序条款与条件"
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            本 GitHub
            开源应用程序条款与条件（"应用程序条款"）是你（作为个人或以实体名义）与
            GitHub, Inc. 之间关于你使用 GitHub 应用程序（例如 GitHub Desktop™
            及相关文档（"软件"））的法律协议。这些应用程序条款适用于该软件的可执行代码版本。该软件的源代码可通过开源软件许可协议单独免费获取。如果你不同意这些应用程序条款中的全部条款，请勿下载、安装、使用或复制该软件。
          </p>

          <h2>连接到 GitHub</h2>

          <p>
            如果你将本软件配置为与 GitHub.com 网站上的一个或更多账户，或与某个
            GitHub Enterprise Server 实例配合使用，则你对软件的使用还将受适用的
            GitHub.com 网站服务条款及/或适用于你的 GitHub Enterprise
            实例的许可协议（"GitHub 条款"）约束。
          </p>

          <p>
            任何违反你适用的 GitHub
            条款而使用本软件的行为，也将构成对这些应用程序条款的违反。
          </p>

          <h2>开源许可证与声明</h2>

          <p>
            本软件的开源许可证包含在随软件一同提供的"开源声明"文档中。该文档还包含全部适用开源许可证的副本。
          </p>

          <p>
            凡适用于开源组件的许可证条款要求 GitHub
            就本软件提供源代码要约的，特此作出该要约，你可通过联系 GitHub
            来行使该权利： <LinkButton uri={contact}>联系</LinkButton>。
          </p>

          <p>
            除非与 GitHub 另有书面约定，你与 GitHub
            的协议至少始终包含这些应用程序条款。本软件源代码的开源软件许可证构成独立的书面协议。在开源软件许可证明确取代这些应用程序条款的有限范围内，开源许可证管辖你与
            GitHub 之间关于使用本软件或其特定包含组件达成的协议。
          </p>

          <h2>GitHub 的标识</h2>

          <p>
            随软件一起授予的许可并不涵盖 GitHub
            的商标，其中包括软件标识设计。GitHub 保留对所有 GitHub
            商标的全部商标权与著作权。GitHub
            的标识包括但不限于"标识"文件夹中文件名带有"logo"的程式化设计。
          </p>

          <p>
            GitHub、GitHub Desktop、GitHub for Mac、GitHub for
            Windows、Atom、Octocat 以及相关的 GitHub 标识和/或程式化名称均为
            GitHub 的商标。你同意未经 GitHub
            事先书面许可，不以任何方式展示或使用这些商标，但 GitHub
            标识与使用政策允许的除外： <LinkButton uri={logos}>标识</LinkButton>
            。
          </p>

          <h2>隐私</h2>

          <p>
            本软件可能会收集个人信息。你可以在设置面板中控制软件收集的信息。如果软件代表
            GitHub 收集了个人信息，GitHub 将按照
            <LinkButton uri={privacyStatement}>GitHub 隐私声明</LinkButton>
            处理该信息。
          </p>

          <h2>附加服务</h2>

          <h3>自动更新服务</h3>

          <p>
            本软件可能包含自动更新服务（"服务"）。如果你选择使用该服务，或下载了自动启用该服务的软件，当有新版本可用时，GitHub
            将自动更新该软件。
          </p>

          <h3>免责声明与责任限制</h3>

          <p>
            本服务按"现状"提供，不提供任何明示或默示的保证。你对服务的使用完全自担风险。GitHub
            不保证：(i) 服务将满足你的特定需求；(ii)
            服务与任何特定平台完全兼容；(iii)
            你对服务的使用将是不间断、及时、安全或无差错的；(iv)
            通过使用服务可能获得的结果将是准确或可靠的；(v)
            你通过服务购买或获取的任何产品、服务、信息或其他材料的质量将符合你的预期；或
            (vi) 服务中的任何错误将被纠正。
          </p>

          <p>
            你明确理解并同意，对于因服务引起的任何直接、间接、偶然、特殊、后果性或惩罚性损害，包括但不限于利润、商誉、使用价值、数据或其他无形损失的损害（即使
            GitHub 已被告知发生此类损害的可能性），GitHub 概不负责，例如：(i)
            使用或无法使用服务；(ii)
            因通过服务购买或获取任何商品、数据、信息或服务，或收发消息或进行交易，而产生的替代商品与服务的采购成本；(iii)
            对你传输内容或数据的未授权访问或篡改；(iv)
            服务上任何第三方的陈述或行为；(v) 或与服务有关的任何其他事项。
          </p>

          <p>
            GitHub
            保留随时（临时或永久地）修改或停止服务（或其任何部分）的权利，无论是否另行通知。对于服务任何价格变动、暂停或中止，GitHub
            对你或任何第三方不承担责任。
          </p>

          <h2>杂项</h2>

          <ol>
            <li>
              不放弃权利。GitHub
              未行使或执行这些应用程序条款中的任何权利或规定，不构成对该权利或规定的放弃。
            </li>

            <li>
              完整协议。这些应用程序条款连同任何适用的隐私声明，构成你与 GitHub
              之间的完整协议，并管辖你对软件的使用，取代你与 GitHub
              之间任何先前的协议（包括但不限于任何先前版本的应用程序条款）。
            </li>

            <li>
              管辖法律。你同意这些应用程序条款及你对软件的使用受加利福尼亚州法律管辖，任何与软件相关的争议必须提交至位于加利福尼亚州旧金山或其附近的具有管辖权的法院审理。
            </li>

            <li>
              第三方软件包。本软件支持第三方"软件包"，其可能修改、添加、移除或改变软件的功能。这些软件包不受这些应用程序条款约束，并可能包含其自身的许可证，用于管辖你对该特定软件包的使用。
            </li>

            <li>
              不得修改；完整协议。这些应用程序条款仅可由 GitHub
              授权代表签署的书面修订，或由 GitHub
              发布修订版本进行修改。这些应用程序条款连同任何适用的开源许可证与声明以及
              GitHub
              隐私声明，构成你与我们之间协议的完整且唯一的陈述。这些应用程序条款取代任何口头或书面的提议、先前的协议，以及你与
              GitHub 之间就这些条款主题进行的任何其他沟通。
            </li>

            <li>
              GitHub 政策许可。这些应用程序条款基于
              <LinkButton uri={license}>知识共享署名许可证</LinkButton>
              授权。你可以在知识共享许可证条款下自由使用它。
            </li>

            <li>
              联系我们。有关这些应用程序条款的任何问题，请发送至
              <LinkButton uri={contact}>support@github.com</LinkButton>。
            </li>
          </ol>
        </DialogContent>

        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
