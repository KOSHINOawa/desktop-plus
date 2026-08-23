import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { CallToAction } from '../lib/call-to-action'

const HelpURL = 'https://help.github.com/articles/about-remote-repositories/'

interface INoRemoteProps {
  /** The function to call when the users chooses to publish. */
  readonly onPublish: () => void
}

/** The component for when a repository has no remote. */
export class NoRemote extends React.Component<INoRemoteProps, {}> {
  public render() {
    return (
      <DialogContent>
        <CallToAction actionTitle="发布" onAction={this.props.onPublish}>
          <div className="no-remote-publish-message">
            将你的仓库发布到 GitHub。需要帮助？{' '}
            <LinkButton uri={HelpURL}>了解有关远程仓库的更多信息。</LinkButton>
          </div>
        </CallToAction>
      </DialogContent>
    )
  }
}
