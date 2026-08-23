import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextArea } from '../lib/text-area'
import { LinkButton } from '../lib/link-button'
import { Ref } from '../lib/ref'

interface IGitIgnoreProps {
  readonly text: string | null
  readonly onIgnoreTextChanged: (text: string) => void
  readonly onShowExamples: () => void
}

/** A view for creating or modifying the repository's gitignore file */
export class GitIgnore extends React.Component<IGitIgnoreProps, {}> {
  public render() {
    return (
      <DialogContent>
        <p id="ignored-files-description">
          正在编辑 <Ref>.gitignore</Ref>。此文件用于指定 Git
          应忽略的、有意不跟踪的文件。已被 Git 跟踪的文件不受影响。{' '}
          <LinkButton onClick={this.props.onShowExamples}>
            了解有关 gitignore 文件的更多信息
          </LinkButton>
        </p>

        <TextArea
          ariaLabel="被忽略的文件"
          ariaDescribedBy="ignored-files-description"
          placeholder="被忽略的文件"
          value={this.props.text || ''}
          onValueChanged={this.props.onIgnoreTextChanged}
          textareaClassName="gitignore"
        />
      </DialogContent>
    )
  }
}
