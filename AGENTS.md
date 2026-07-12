# AGENTS.md — n8n × Radware Agentic AI Protection Connector

Canonical guidance for AI agents working in this repo. CLAUDE.md points here.

## Mission

Customer-facing n8n community node package `@radware/n8n-nodes-radware-agentic-protection`: a Radware-protected chat model (`RadwareChatModel`, outputs `AiLanguageModel`) plus credential type `RadwareInPathApi`. **In-path only, deliberately** — n8n community nodes cannot intercept every native AI Agent action, and a partial out-of-path guard would give false confidence. `tests/packageManifest.test.mjs` enforces this scoping; do not add an out-of-path node without an explicit product decision from Sean.

## Read first

- Radware API contracts & security rules → skill `radware-agentic-protection-api`.
- Process standards → skill `radware-connector-factory`.
- Repo docs: `README.md`, `docs/customer-guide.md`, `docs/in-path.md`, `docs/validation.md`, `internal/publishing.md` (n8n community-node rules: no env access in node runtime; credentials via `ICredentialType` only).

## Layout

- `nodes/RadwareChatModel/RadwareChatModel.node.ts` — delegates to `@n8n/ai-node-sdk` `supplyModel()`; `resolveBaseUrl()`/`cleanSegment()` build `https://api.agentic.radwarecto.com/v1/<provider>`.
- `credentials/RadwareInPathApi.credentials.ts` — apiKey (`password: true`), base URL, provider segment; `ICredentialTestRequest` hits `/models` for the UI Test button.
- CI: `.github/workflows/ci.yml` (install→build→lint→test→pack dry-run), `publish.yml` (tag-triggered, npm OIDC provenance). These are the reference workflows for all Radware connectors — keep them green.

## Hard rules

1. In-path only (see Mission). The manifest test must keep passing.
2. Secrets only via n8n credentials; never env vars in node runtime code, never raw keys in node parameters or logs.
3. Fail-close by definition: connectivity failure fails the model turn. Do not add fallback-to-unprotected-provider logic under any framing.
4. n8n lint (`n8n-node lint`) and build must pass; follow community-node review constraints or npm/n8n listing breaks.
5. Package metadata: author must be Radware corporate identity — **the current personal Gmail in `package.json` author is a known defect; fix on next release, don't propagate it anywhere.**
6. Keep `.env.example` limited to vars this package actually uses (legacy out-of-path vars are a known leftover to remove).

## Known gaps (backlog)

- No CHANGELOG.md — start one next release.
- README is thin vs the OpenClaw connector's: troubleshooting section (wrong key, Report-Only vs Block policy, where EventIds appear, timeout behavior) is the main missing piece.
- Only one automated test; add verdict/base-URL unit tests when touching that code.

## Validation before you finish

`npm run build && npm run lint && npm test && npm pack --dry-run`. For behavior changes: install into a local n8n instance as a community node, wire RadwareChatModel into an AI Agent workflow, run one benign + one blocked prompt with staging keys, confirm the block text and portal Event ID. `scripts/validate-radware-live.mjs` automates the API-level probes.
