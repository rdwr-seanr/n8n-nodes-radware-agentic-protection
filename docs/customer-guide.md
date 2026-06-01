# Radware Agentic AI Protection for n8n

This guide explains how to protect n8n AI Agent workflows with Radware Agentic AI Protection.

Use one package:

```text
n8n-nodes-radware-agentic-protection
```

The package contains two customer-facing nodes:

- `Radware Chat Model` for in-path deployments.
- `Radware Agentic Guard` for out-of-path deployments.

Create the required homegrown agent and copy the API key from Radware Cloud:

```text
https://console.radwarecloud.com/
```

## Choose a Deployment Mode

| Mode | Use When | n8n Model Traffic | Required Radware Node Placement |
| --- | --- | --- | --- |
| In-path | You want Radware to proxy the AI Agent model connection | AI Agent sends model traffic to Radware instead of directly to the provider | `Radware Chat Model` connected to the AI Agent as its Chat Model |
| Out-of-path | You want to keep the customer's existing n8n model node and add explicit checks | AI Agent keeps OpenAI, Gemini, Anthropic, or another model node | `Radware Agentic Guard` before the AI Agent, after the AI Agent, and before sensitive tool actions |

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

## Out-of-Path Quickstart

1. In Radware Cloud, create a homegrown agent with out-of-path enforcement.
2. In n8n, create `Radware Out-of-Path API` credentials.
3. Add `Radware Agentic Guard` before the AI Agent and set operation to `Check Prompt`.
4. Keep the customer's existing chat model connected to the AI Agent.
5. Add `Radware Agentic Guard` after the AI Agent and set operation to `Check Response`.
6. For sensitive actions, use n8n workflow tools. The called workflow must start with `Radware Agentic Guard` set to `Check Tool Action`.

Expected main canvas:

```text
Trigger -> Radware Prompt Guard -> AI Agent -> Radware Response Guard
                                  ^      ^
                                  |      |
                          Chat Model     Guarded workflow tool
```

Expected sensitive tool sub-workflow:

```text
When Called by AI Agent -> Radware Tool Action Guard -> Send Email / HTTP Request / file write / delete
```

Do not add Radware only as an AI Agent tool and expect full protection. The model decides whether to call tools. Prompt and response guardrails must be explicit main-path nodes so they run every time.

## What Each Check Covers

| Check | Node Operation | Radware Module |
| --- | --- | --- |
| Prompt before LLM | `Check Prompt` | AI Guardrails for prompt, PII, HAPBlocker, and topic policy |
| Final LLM answer | `Check Response` | AI Guardrails for response-side PII, HAPBlocker, topic, and unsafe output controls |
| Tool/action before execution | `Check Tool Action` | Behavioral / Agentic Protection for unsafe action, exfiltration, and risky tool use |

## Production Defaults

- Use `fail-close` for production actions that send, write, delete, or call external systems.
- Use stable `User Identifier` values so Radware portal events can be traced back to a user or workflow.
- Keep Radware keys only in n8n credentials.
- Keep direct provider credentials only in the customer model node for out-of-path deployments.
- Replace example placeholders with real credential IDs and tool workflow IDs after importing examples.
