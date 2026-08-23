import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { Row } from '../../ui/lib/row'
import { Select } from '../lib/select'
import { suggestedExternalEditor } from '../../lib/editors/shared'
import { ICustomIntegration } from '../../lib/custom-integration'
import { enableCustomIntegration } from '../../lib/feature-flag'
import { CustomIntegrationForm } from '../preferences/custom-integration-form'

const CustomIntegrationValue = 'other'
const DoNotOverrideValue = 'do-not-override'

interface IIntegrationsPreferencesProps {
  readonly availableEditors: ReadonlyArray<string>
  readonly useDefaultEditor: boolean
  readonly selectedExternalEditor: string | null
  readonly useCustomEditor: boolean
  readonly customEditor: ICustomIntegration
  readonly onSelectedEditorChanged: (editor: string) => void
  readonly onUseDefaultEditorChanged: (useDefaultEditor: boolean) => void
  readonly onUseCustomEditorChanged: (useCustomEditor: boolean) => void
  readonly onCustomEditorChanged: (customEditor: ICustomIntegration) => void
}

interface IIntegrationsPreferencesState {
  readonly useDefaultEditor: boolean
  readonly selectedExternalEditor: string | null
  readonly useCustomEditor: boolean
  readonly customEditor: ICustomIntegration
}

export class Integrations extends React.Component<
  IIntegrationsPreferencesProps,
  IIntegrationsPreferencesState
> {
  private customEditorFormRef = React.createRef<CustomIntegrationForm>()

  public constructor(props: IIntegrationsPreferencesProps) {
    super(props)

    this.state = {
      useDefaultEditor: props.useDefaultEditor,
      selectedExternalEditor: this.props.selectedExternalEditor,
      useCustomEditor: this.props.useCustomEditor,
      customEditor: this.props.customEditor,
    }
  }

  public async componentWillReceiveProps(
    nextProps: IIntegrationsPreferencesProps
  ) {
    const editors = nextProps.availableEditors
    let selectedExternalEditor = nextProps.selectedExternalEditor
    if (editors.length) {
      const indexOf = selectedExternalEditor
        ? editors.indexOf(selectedExternalEditor)
        : -1
      if (indexOf === -1) {
        selectedExternalEditor = editors[0]
        nextProps.onSelectedEditorChanged(selectedExternalEditor)
      }
    }

    this.setState({
      useDefaultEditor: nextProps.useDefaultEditor,
      selectedExternalEditor,
      useCustomEditor: nextProps.useCustomEditor,
      customEditor: nextProps.customEditor,
    })
  }

  public componentDidMount(): void {
    if (enableCustomIntegration()) {
      const { availableEditors, useCustomEditor } = this.props

      // When there are no available editors or shells, the `Select` component
      // will have the custom editor or shell already selected, but we need
      // to handle that as initial value, otherwise the custom integration
      // form won't be rendered.

      if (availableEditors.length === 0 && !useCustomEditor) {
        this.setSelectedEditor(CustomIntegrationValue)
      }
    }
  }

  public componentDidUpdate(
    prevProps: IIntegrationsPreferencesProps,
    prevState: IIntegrationsPreferencesState
  ): void {
    // When the user switches to the custom editor or shell, we want to focus the
    // path input field.
    if (!prevState.useCustomEditor && this.state.useCustomEditor) {
      this.customEditorFormRef.current?.focus()
    }
  }

  private onSelectedEditorChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    if (!value) {
      return
    }

    this.setSelectedEditor(value)
  }

  private setSelectedEditor = (editor: string) => {
    if (editor === CustomIntegrationValue) {
      this.setState({ useCustomEditor: true })
      this.props.onUseCustomEditorChanged(true)
      this.props.onUseDefaultEditorChanged(false)
    } else if (editor === DoNotOverrideValue) {
      this.setState({ useDefaultEditor: false })
      this.props.onUseDefaultEditorChanged(true)
      this.props.onUseCustomEditorChanged(false)
    } else {
      this.setState({
        useDefaultEditor: false,
        useCustomEditor: false,
        selectedExternalEditor: editor,
      })
      this.props.onUseDefaultEditorChanged(false)
      this.props.onUseCustomEditorChanged(false)
      this.props.onSelectedEditorChanged(editor)
    }
  }

  private renderExternalEditor() {
    const options = this.props.availableEditors
    return (
      <Select
        aria-label="自定义外部编辑器"
        value={this.getSelectorValue()}
        onChange={this.onSelectedEditorChanged}
      >
        <option key={DoNotOverrideValue} value={DoNotOverrideValue}>
          {__DARWIN__ ? '使用默认编辑器' : '使用默认编辑器'}
        </option>
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option key={CustomIntegrationValue} value={CustomIntegrationValue}>
          {__DARWIN__ ? '配置自定义编辑器…' : '配置自定义编辑器…'}
        </option>
      </Select>
    )
  }

  private getSelectorValue() {
    if (this.state.useCustomEditor) {
      return CustomIntegrationValue
    }
    if (this.state.useDefaultEditor) {
      return DoNotOverrideValue
    }
    return this.state.selectedExternalEditor ?? undefined
  }

  private renderNoExternalEditorHint() {
    const options = this.props.availableEditors
    if (options.length > 0) {
      return null
    }

    return (
      <Row>
        <div className="no-options-found">
          <span>
            未找到其他编辑器。{' '}
            <LinkButton uri={suggestedExternalEditor.url}>
              安装 {suggestedExternalEditor.name}？
            </LinkButton>
          </span>
        </div>
      </Row>
    )
  }

  private renderCustomExternalEditor() {
    return (
      <Row>
        <CustomIntegrationForm
          id="custom-editor"
          ref={this.customEditorFormRef}
          path={this.state.customEditor.path ?? ''}
          arguments={this.state.customEditor.arguments}
          onPathChanged={this.onCustomEditorPathChanged}
          onArgumentsChanged={this.onCustomEditorArgumentsChanged}
        />
      </Row>
    )
  }

  private onCustomEditorPathChanged = (path: string, bundleID?: string) => {
    const customEditor: ICustomIntegration = {
      path,
      bundleID,
      arguments: this.state.customEditor.arguments ?? [],
    }

    this.setState({ customEditor })
    this.props.onCustomEditorChanged(customEditor)
  }

  private onCustomEditorArgumentsChanged = (args: string) => {
    const customEditor: ICustomIntegration = {
      path: this.state.customEditor.path,
      bundleID: this.state.customEditor.bundleID,
      arguments: args,
    }

    this.setState({ customEditor })
    this.props.onCustomEditorChanged(customEditor)
  }

  public render() {
    return (
      <DialogContent>
        <fieldset className="advanced-section">
          <legend>
            <h2>
              {__DARWIN__ ? '自定义外部编辑器' : '自定义外部编辑器'}
            </h2>
          </legend>
          <Row>{this.renderExternalEditor()}</Row>
          {this.state.useCustomEditor && this.renderCustomExternalEditor()}
          {this.renderNoExternalEditorHint()}
        </fieldset>
      </DialogContent>
    )
  }
}
