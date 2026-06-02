# n8n Radware Agentic AI Protection

This package provides n8n community nodes for Radware Agentic AI Protection.

It supports two deployment patterns:

- In-path protection with `Radware Chat Model`, an n8n AI language model node that routes model traffic through Radware.
- Out-of-path protection with `Radware Agentic Guard`, an explicit guard node that calls Radware before LLM prompts or workflow tool actions.

Both patterns are designed to validate AI Guardrails and Behavioral / Agentic Protection.

## Installation

Install this as an n8n community node package:

```bash
npm install n8n-nodes-radware-agentic-protection
```

For n8n self-hosted instances, follow the n8n community-node installation guide and install the package from the n8n UI or from the instance package manager.

## Credentials

Create separate Radware homegrown agents in the Radware portal for each enforcement mode you want to validate.

### Radware In-Path API

Use this credential with `Radware Chat Model`.

- `Radware API Key`: API key copied from the in-path homegrown agent.
- `Provider`: provider segment Radware forwards to, such as `openai`, `anthropic`, `google`, or custom.
- `Resolved Base URL`: optional full base URL. If empty, the node uses `https://api.agentic.radwarecto.com/v1/<provider>`.

### Radware Out-of-Path API

Use this credential with `Radware Agentic Guard`.

- `Radware API Key`: API key copied from the out-of-path homegrown agent.
- `Endpoint`: defaults to `https://api.agentic.radwarecto.com/llmp/digester/agentic-api`.

Do not store Radware keys in workflow JSON, screenshots, Git, or validation reports.

## Nodes

### Radware Chat Model

Use this node as the LLM model connection for n8n AI Agents. The AI Agent sends model traffic to Radware instead of directly to OpenAI, Gemini, or another provider. Radware proxies the request to the provider configured for the homegrown agent.

Typical use:

```text
Chat Trigger -> AI Agent
                ^
                Radware Chat Model
```

### Radware Agentic Guard

Use this node for explicit out-of-path enforcement.

Operations:

- `Check Prompt`: call Radware before an LLM interaction for prompt-stage AI Guardrails.
- `Check Response`: call Radware after the AI Agent produces a final response and before returning it to the user.
- `Check Tool Action`: call Radware before a sensitive workflow action for Behavioral protection.

For AI Agent tools, put this node at the start of the n8n sub-workflow used as the tool, before actions such as Send Email, HTTP Request, file write, delete, or external API calls.

Typical out-of-path AI Agent use:

```text
Chat Trigger -> Radware Prompt Guard -> AI Agent -> Radware Response Guard
                                      ^      ^
                                      |      |
                              Chat Model    Guarded tool sub-workflow
```

The guarded tool sub-workflow should start with `Radware Agentic Guard` in `Check Tool Action` mode, then continue to the sensitive action only when Radware allows it. Do not rely on using Radware only as an AI Agent tool; the prompt and response checks must be in the main workflow path so they run on every turn.

For Behavioral / Agentic Protection, include the relevant tool chain in `Tools Schema`. For example, if the agent first reads an email and then proposes `send_email`, configure the tool guard with both `read_email` and `send_email` schemas and include the retrieved email content in `User Context`.

## Examples

- `examples/in-path-agent-model-example.json`: AI Agent using `Radware Chat Model` as its in-path model.
- `examples/out-of-path-guarded-tool-workflow.json`: AI Agent with prompt-stage Radware guard and a guarded workflow tool placeholder.
- `examples/out-of-path-guarded-send-email-subworkflow.json`: sub-workflow tool pattern with Radware tool-action guard before a send-email placeholder.

## Validation

Minimum validation for each supported mode:

- Benign prompt is allowed.
- Credit-card PII prompt is blocked by AI Guardrails.
- HAPBlocker prompt is blocked by AI Guardrails.
- Medical/medicine blocked-topic prompt is blocked by AI Guardrails.
- Benign tool action is allowed.
- Malicious tool action is blocked by Behavioral / Agentic Protection.
- Failure mode is documented. Out-of-path defaults to fail-close.

See [docs/validation.md](docs/validation.md).

## Security Notes

- The package has no runtime dependencies.
- Verified-community-node constraints mean this package does not globally intercept every workflow action.
- Out-of-path protection is explicit: place `Radware Agentic Guard` before the actions that require enforcement.
- Keep `fail-close` for production workflows that send, write, delete, or call external systems unless the customer explicitly accepts fail-open risk.

## Resources

- [Customer guide](docs/customer-guide.md)
- [In-path setup](docs/in-path.md)
- [Out-of-path setup](docs/out-of-path.md)
- [Validation guide](docs/validation.md)
- [Publishing checklist](docs/publishing.md)
