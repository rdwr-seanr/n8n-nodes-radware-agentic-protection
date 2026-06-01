# Out-of-Path Setup

Out-of-path protection uses explicit Radware API calls from the n8n workflow.

Open Radware Cloud and create a homegrown agent with `Out-of-Path Enforcement`:

```text
https://console.radwarecloud.com/
```

Use `Radware Agentic Guard` before the interaction or action that needs protection. For n8n AI Agents, the customer-facing pattern is an actual AI Agent workflow with explicit guards around the points n8n lets community nodes control.

Recommended AI Agent canvas:

```text
Manual/Chat Trigger -> Radware Prompt Guard -> AI Agent -> Radware Response Guard
                                            ^      ^
                                            |      |
                                    Chat Model     Guarded workflow tool
```

The prompt guard validates the user request and available context before the agent calls the customer's selected model. The response guard validates the LLM final response before it is returned to the user. The guarded workflow tool wraps sensitive actions such as Send Email, HTTP Request, file write, delete, or external API updates.

Do not rely on adding Radware only as an AI Agent tool. n8n agents invoke tools only when the model chooses to call them. Prompt and response guardrails must be explicit main-path nodes so they run for every interaction.

## Prompt-Stage Guardrails

Place `Radware Agentic Guard` before the AI Agent and choose `Check Prompt`.

Map:

- `User Prompt`: the user's prompt, chat input, or workflow request.
- `User Identifier`: a user or workflow identifier that will help locate events in the Radware portal.
- `User Context`: relevant conversation history or retrieved content.
- `Model To Use`: the model used by the downstream AI Agent.

When Radware returns `IsBlocked=true`, the default behavior is to stop the workflow.

## Response-Stage Guardrails

Place `Radware Agentic Guard` immediately after the AI Agent and choose `Check Response`.

Map:

- `User Prompt`: the original user prompt. In the example this references the input-preparation node.
- `User Identifier`: the same user or workflow identifier used by the prompt guard.
- `User Context`: conversation history, retrieved content, and the AI Agent output.
- `LLM Response`: the final response produced by the AI Agent.
- `Model To Use`: the model used by the AI Agent.

This second guard call is what validates response-side AI Guardrails such as unsafe output, response PII leakage, HAPBlocker output, and blocked response topics.

## Tool-Stage Behavioral Protection

For n8n AI Agents, the best verified-community-node pattern is to wrap sensitive actions in an n8n sub-workflow tool:

```text
AI Agent -> Call n8n Sub-Workflow Tool -> guarded sub-workflow
```

Inside the guarded sub-workflow:

```text
Trigger -> Radware Agentic Guard (Check Tool Action) -> sensitive action
```

The package includes two importable out-of-path examples:

- `examples/out-of-path-guarded-tool-workflow.json`: main AI Agent workflow with prompt-stage guard and a guarded workflow tool placeholder.
- The same main workflow includes `Radware Response Guard` after the AI Agent for response-stage checks.
- `examples/out-of-path-guarded-send-email-subworkflow.json`: sub-workflow tool that starts with tool-stage Radware enforcement.

Examples of sensitive actions:

- Send Email
- HTTP Request
- Write file
- Delete file
- CRM or ticket update
- Any external system mutation

The guard sends:

- `UserPrompt`
- `UserIdentifier`
- `UserContext`
- `ToolName`
- `ArgsInput`
- `ToolsInput`
- `ApiKey`
- `ModelToUse`

If `Tools Schema` is empty, the node infers a simple OpenAI-compatible function schema from `Tool Arguments`.

## Fail Modes

`fail-close` is the default and recommended production setting. If Radware is unavailable, the workflow stops or returns a blocked decision.

`fail-open` allows the workflow to continue if Radware is unavailable. It does not override Radware policy blocks.

## Return Decision Mode

By default, the node stops the workflow when Radware blocks.

Choose `Return Decision` when the workflow needs to branch explicitly. The node outputs:

```json
{
  "radware": {
    "isBlocked": true,
    "status": "blocked",
    "eventId": "event id when present",
    "module": "security module when present",
    "failMode": "fail-close",
    "blockReason": "reason when present"
  }
}
```
