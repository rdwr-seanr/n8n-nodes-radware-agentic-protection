# Publishing Checklist

Package name:

```text
n8n-nodes-radware-agentic-protection
```

## Local Checks

Run:

```bash
npm ci
npm run build
npm run lint
npm test
npm pack --dry-run
npx @n8n/scan-community-package n8n-nodes-radware-agentic-protection
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

The package is not installable from the n8n UI until it exists on public npm. Before that, local tarball installs are for lab validation only.

Configure npm Trusted Publishing for the repository and `.github/workflows/publish.yml`. Then use a GitHub release tag to publish with provenance:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The publish workflow uses GitHub Actions OIDC and `npm publish --provenance --access public`, so no long-lived npm token is required when Trusted Publishing is configured.

After npm publication, submit the package through the n8n Creator Portal for verification.

## npm Publication Steps

1. Push this repository to GitHub under the final public repository URL.
2. In npm, create or confirm access to the package name `n8n-nodes-radware-agentic-protection`.
3. Configure npm Trusted Publishing for this GitHub repository and the `Publish` GitHub Actions workflow.
4. Confirm `package.json` metadata points to the final public GitHub repository.
5. Run local checks from a clean checkout.
6. Push tag `v0.1.0`.
7. Confirm the GitHub Actions publish job completed and npm shows the package.
8. In n8n, install the package by name from **Settings -> Community Nodes**.

## n8n Creator Portal Submission

Submit after npm publication and live validation.

Include:

- npm package name.
- Public GitHub repository.
- README and customer guide.
- In-path and out-of-path example workflows.
- Validation report with sanitized Event IDs.
- Confirmation that the package has no runtime dependencies and no environment-variable or filesystem access in runtime node code.
- Explanation that `Radware Chat Model` is the in-path model node and `Radware Agentic Guard` is the out-of-path explicit enforcement node.

## Customer Install Experience

After npm publication, customers install one package:

```text
n8n-nodes-radware-agentic-protection
```

They then get:

- `Radware Chat Model`: in-path AI Agent chat model.
- `Radware Agentic Guard`: out-of-path prompt, response, and tool-action guard.
- `Radware In-Path API` credentials.
- `Radware Out-of-Path API` credentials.
