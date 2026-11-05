# Security

Report suspected vulnerabilities privately through the repository's GitHub security reporting channel if enabled, or contact the owner through the profile linked on the repository. Do not include exploit details or secrets in a public issue. Include the affected version, reproduction steps, and expected impact. No response-time guarantee is offered.

The core renderer accepts palette values only as hex colors and validates its layouts, shapes, modes, numeric inputs, and flags. It creates SVG nodes directly and does not insert HTML strings supplied by callers. Applications remain responsible for their own content and dependencies.

CI uses read-only permissions. Release Please has explicit contents and pull-request permissions to create version PRs and GitHub releases; it does not approve or merge PRs. Action code is pinned to commit SHAs and Dependabot checks tooling and action updates. The development minimatch override selects its patched release; the lint, build, and versioning tests verify compatibility. No long-lived npm token is stored in this repository.
