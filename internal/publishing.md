# Publishing Checklist

Package name:

```text
@radware/n8n-nodes-radware-agentic-protection
```

## Local Checks

Run:

```bash
npm ci
npm run build
npm run lint
npm test
npm pack --dry-run
npx @n8n/scan-community-package @radware/n8n-nodes-radware-agentic-protection
```

## n8n Community Requirements

Keep the package verified-ready:

- No runtime dependencies.
- No filesystem access in node runtime code.
- No environment-variable access in node runtime code.
- No secrets in package files, examples, screenshots, or reports.
- Public repository with README, docs, examples, and license.
- GitHub Actions provenance publishing for npm.

## Release

The package is installable from the n8n UI only after it exists on public npm.

Configure npm Trusted Publishing for the repository and `.github/workflows/publish.yml`, or add an `NPM_TOKEN` GitHub Actions secret as a fallback. Then use a GitHub release tag to publish with provenance:

```bash
git tag v0.3.2
git push origin v0.3.2
```

The publish workflow uses `npm run release`, which the n8n node CLI maps to a provenance-enabled npm publish inside GitHub Actions.

## npm Publication Steps

1. Push this repository to GitHub under the final public repository URL.
2. In npm, confirm access to the Radware organization package name `@radware/n8n-nodes-radware-agentic-protection`.
3. Configure npm Trusted Publishing for this GitHub repository and the `Publish` GitHub Actions workflow.
4. Confirm `package.json` metadata points to the final public GitHub repository.
5. Run local checks from a clean checkout.
6. Push tag `v0.3.2`.
7. Confirm the GitHub Actions publish job completed and npm shows the package.
8. In n8n, install the package by name from **Settings -> Community Nodes**.

For the first scoped release, publish with `--access public` (the repository also sets `publishConfig.access` to `public`). After the package exists, configure npm Trusted Publishing for `Radware/n8n-nodes-radware-agentic-protection` and `publish.yml`; use OIDC for subsequent releases instead of a long-lived token.

After the scoped package is confirmed installable, update the n8n Creator Portal submission to:

```text
https://www.npmjs.com/package/@radware/n8n-nodes-radware-agentic-protection
```

Changing the npm package identity may trigger another n8n review. Do not deprecate the legacy unscoped package until the scoped package is public, installable, scanned, and reflected in the Creator Portal.

## n8n Creator Portal Submission

Submit after npm publication and live validation.

Include:

- npm package name.
- Public GitHub repository.
- README and customer guide.
- In-path AI Agent example workflow.
- Validation report with sanitized Event IDs.
- Confirmation that the package has no runtime dependencies and no environment-variable or filesystem access in runtime node code.
- Explanation that `Radware Chat Model` is the in-path language model node for n8n AI Agents.
- Explanation that out-of-path is not exposed because n8n community nodes cannot globally intercept arbitrary AI Agent tool execution.

## Video Demo

Show:

1. Install `@radware/n8n-nodes-radware-agentic-protection` from npm.
2. Create or select `Radware In-Path API` credentials and run the credential test.
3. Create an n8n AI Agent workflow.
4. Add `Radware Chat Model` from the Language Models list.
5. Connect it to the AI Agent as the Chat Model.
6. Send a benign chat prompt and show the response.
7. Explain that Radware Cloud is the upstream control point for AI Guardrails and Behavioral / Agentic Protection.

Do not present an out-of-path guard workflow as part of the customer package demo.

## Customer Install Experience

After npm publication, customers install one package:

```text
@radware/n8n-nodes-radware-agentic-protection
```

They then get:

- `Radware Chat Model`: in-path AI Agent chat model.
- `Radware In-Path API` credentials.
