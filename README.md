# n8n Radware Agentic AI Protection

This package provides the `Radware Chat Model` community node for n8n AI Agents.

It is intentionally positioned as an in-path integration only. In n8n, this is the only clean customer deployment pattern that can protect the AI Agent interaction as a full model path: AI Guardrails for prompts and responses, plus Behavioral / Agentic Protection when tool context is present in the model request.

Out-of-path is not exposed as a public node in this package. n8n community nodes cannot globally intercept every native AI Agent tool or workflow action before execution. An explicit guard node can protect only the actions a customer manually routes through it, which is not a full one-go n8n AI Agent protection deployment.

## Installation

Install this as an n8n community node package:

```bash
npm install n8n-nodes-radware-agentic-protection
```

For n8n self-hosted instances, install the package from the n8n community-node UI or from the instance package manager.

## Credential

Create a Radware homegrown agent with in-path enforcement in Radware Cloud:

```text
https://console.radwarecloud.com/
```

Then create `Radware In-Path API` credentials in n8n:

- `Radware API Key`: API key copied from the Radware in-path homegrown agent.
- `Provider`: provider segment Radware forwards to, such as `openai`, `anthropic`, `google`, or custom.
- `Resolved Base URL`: optional full base URL. If empty, the node uses `https://api.agentic.radwarecto.com/v1/<provider>`.

Do not store Radware keys in workflow JSON, screenshots, Git, or validation reports.

## Node

### Radware Chat Model

Use this node as the LLM model connection for n8n AI Agents. The AI Agent sends model traffic to Radware instead of directly to OpenAI, Gemini, Anthropic, or another provider. Radware applies Agentic AI Protection and proxies the request to the provider configured for the Radware homegrown agent.

Typical canvas:

```text
Chat Trigger -> AI Agent
                ^
                Radware Chat Model
```

Direct OpenAI/Gemini/etc. model credentials are not used by that AI Agent path. The customer configures the upstream provider in Radware Cloud.

## Coverage

- AI Guardrails: prompt, response, topic, HAPBlocker, and PII controls through the in-path model request/response.
- Behavioral / Agentic Protection: unsafe tool/action detection when the AI Agent's model request includes the relevant tool definitions and tool-call context.

For Behavioral validation, use a deterministic tool-call case where the model request includes the prior tool output and all relevant tools, for example `read_email` and `send_email`.

## Example

- `examples/in-path-agent-model-example.json`: AI Agent using `Radware Chat Model` as its in-path model.

## Validation

Minimum validation:

- Benign prompt is allowed.
- Credit-card PII prompt is blocked by AI Guardrails.
- HAPBlocker prompt is blocked by AI Guardrails.
- Medical/medicine blocked-topic prompt is blocked by AI Guardrails.
- Benign tool action is allowed.
- Malicious tool action is blocked by Behavioral / Agentic Protection when full tool context is present.

See [docs/validation.md](docs/validation.md).

## Security Notes

- The package has no runtime dependencies.
- The package exposes only the in-path language model node for n8n customers.
- In-path is fail-close by default: if Radware/provider connectivity fails, the AI Agent model turn fails rather than silently calling an unprotected provider.

## Resources

- [Customer guide](docs/customer-guide.md)
- [In-path setup](docs/in-path.md)
- [Validation guide](docs/validation.md)
- [Publishing checklist](docs/publishing.md)
