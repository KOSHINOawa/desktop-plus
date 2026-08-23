import * as React from 'react'
import { isLocalBaseUrl, type IBYOKProvider } from '../../lib/copilot/byok'
import { Button } from '../lib/button'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface ICopilotCustomProvidersDialogProps {
  readonly providers: ReadonlyArray<IBYOKProvider>
  readonly onAddProvider: () => void
  readonly onEditProvider: (provider: IBYOKProvider) => void
  readonly onDeleteProvider: (provider: IBYOKProvider) => void
  readonly onDismissed: () => void
}

/** Dialog for managing custom Copilot model providers. */
export class CopilotCustomProvidersDialog extends React.Component<ICopilotCustomProvidersDialogProps> {
  private onAddProviderClick = () => this.props.onAddProvider()

  private onEditProviderClick = (provider: IBYOKProvider) => () =>
    this.props.onEditProvider(provider)

  private onDeleteProviderClick = (provider: IBYOKProvider) => () =>
    this.props.onDeleteProvider(provider)

  public render() {
    return (
      <Dialog
        id="copilot-custom-providers-dialog"
        className="copilot-settings-dialog"
        title={__DARWIN__ ? '自定义提供商' : '自定义提供商'}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <div className="copilot-section">
            {this.renderProviders()}
            <Button onClick={this.onAddProviderClick}>
              {__DARWIN__ ? '添加提供商…' : '添加提供商…'}
            </Button>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="完成"
            cancelButtonVisible={false}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderProviders(): JSX.Element {
    if (this.props.providers.length === 0) {
      return (
        <p className="copilot-byok-empty">
          添加自定义提供商，以将你自己的 API 密钥用于 OpenAI
          兼容的端点、Azure、Anthropic，或 Ollama 等本地提供商。
        </p>
      )
    }

    return (
      <ul className="copilot-byok-entry-list">
        {this.props.providers.map(this.renderProvider)}
      </ul>
    )
  }

  private renderProvider = (provider: IBYOKProvider) => {
    const modelCount = provider.models.length
    const modelLabel = modelCount === 1 ? '1 个模型' : `${modelCount} 个模型`
    const isLocal = isLocalBaseUrl(provider.baseUrl)

    return (
      <li key={provider.id} className="copilot-byok-entry">
        <div className="copilot-byok-entry-info">
          <div className="copilot-byok-entry-title">
            <span>{provider.name}</span>
            {isLocal && (
              <span className="copilot-byok-provider-badge">本地</span>
            )}
          </div>
          <span className="copilot-byok-entry-meta">
            {this.formatProviderType(provider)} · {modelLabel}
          </span>
        </div>
        <div className="copilot-byok-entry-actions">
          <Button
            onClick={this.onEditProviderClick(provider)}
            ariaLabel={`编辑 ${provider.name}`}
          >
            <Octicon symbol={octicons.pencil} />
          </Button>
          <Button
            onClick={this.onDeleteProviderClick(provider)}
            ariaLabel={`移除 ${provider.name}`}
          >
            <Octicon symbol={octicons.trash} />
          </Button>
        </div>
      </li>
    )
  }

  private formatProviderType(provider: IBYOKProvider): string {
    switch (provider.type) {
      case 'openai':
        return 'OpenAI 兼容'
      case 'azure':
        return 'Azure'
      case 'anthropic':
        return 'Anthropic'
    }
  }
}
