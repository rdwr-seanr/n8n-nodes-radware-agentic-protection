# Radware Agentic AI Protection for n8n

This guide explains the supported customer deployment for protecting n8n AI Agent workflows with Radware Agentic AI Protection.

Use one package:

```text
@radware/n8n-nodes-radware-agentic-protection
```

The package exposes one customer-facing node:

- `Radware Chat Model` for in-path deployments.

Install it in n8n from **Settings -> Community Nodes** using the full scoped package name above. Customers migrating from `n8n-nodes-radware-agentic-protection` should uninstall the legacy package, install the official Radware package, reopen each protected workflow, and verify the model connection and credential selection.

Official npm package: <https://www.npmjs.com/package/@radware/n8n-nodes-radware-agentic-protection>

Create the required in-path homegrown agent and copy the API key from Radware Cloud:

```text
https://console.radwarecloud.com/
```

## Supported Deployment

| Mode | Use When | n8n Model Traffic | Required Radware Node Placement |
| --- | --- | --- | --- |
| In-path | You want Radware to protect the AI Agent's full model path | AI Agent sends model traffic to Radware instead of directly to the provider | `Radware Chat Model` connected to the AI Agent as its Chat Model |

## In-Path Quickstart

1. In Radware Cloud, create a homegrown agent with in-path enforcement.
2. In n8n, create `Radware In-Path API` credentials.
3. Add an n8n `AI Agent`.
4. Add `Radware Chat Model`.
5. Connect `Radware Chat Model` to the AI Agent's Chat Model input.
6. Do not connect a direct OpenAI/Gemini/etc. chat model to that same agent path.

Expected canvas:

```text
Trigger -> AI Agent
           ^
           Radware Chat Model
```

## What It Covers

| Check | Radware Module |
| --- | --- |
| Prompt before LLM | AI Guardrails for prompt, PII, HAPBlocker, and topic policy |
| Final LLM answer | AI Guardrails for response-side PII, HAPBlocker, topic, and unsafe output controls |
| Tool/action context in model request | Behavioral / Agentic Protection for unsafe action, exfiltration, and risky tool use |

For Behavioral / Agentic Protection validation, use a workflow where the AI Agent's model request includes the relevant tools and prior tool output. For example, include both `read_email` and `send_email` tools, then test a retrieved email that tries to force exfiltration through `send_email`.

## Why Out-of-Path Is Not Exposed

n8n community nodes cannot globally intercept every AI Agent tool or workflow action before execution. An out-of-path guard node would protect only actions a customer manually routes through that node or a guarded sub-workflow. That is useful as an advanced workflow pattern, but it is not a full one-go n8n AI Agent protection deployment.

Because this package is intended to be public and easy for customers to use, it exposes only the in-path model node.

## Production Defaults

- Use only `Radware Chat Model` as the AI Agent's model node on the protected path.
- Keep Radware keys only in n8n credentials.
- Configure the upstream provider in Radware Cloud.
- Validate Behavioral / Agentic Protection with tool context, not with a plain chat prompt.
