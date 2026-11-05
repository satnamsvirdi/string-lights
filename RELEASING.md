# Semantic versions and releases

Both npm packages share one version. `release-please-config.json` treats the repository root as the release unit, so changes in `src/`, the React component, or package files are all visible to the release tool. Its extra-file updaters synchronize both package versions, the React-to-core dependency range, and workspace lock entries. The root Node strategy updates the root manifest/lock and changelog. Unit tests validate these updates against Release Please's actual parser and JSON updater.

| Commit                                                  | Result                      |
| ------------------------------------------------------- | --------------------------- |
| `fix: repair capture` or `perf: reduce idle work`       | Patch                       |
| `feat: add a bulb shape`                                | Minor                       |
| `feat!: change the API` or a `BREAKING CHANGE:` footer  | Major, including before 1.0 |
| Documentation/tooling changes without a breaking marker | No release                  |

`npm run version:auto` previews the next version from Conventional Commits since the most recent `v*` tag. It does not change files, commit, tag, or publish. The configured first release is `0.1.0`; subsequent versions use the table above. `.release-please-manifest.json` records the release baseline, not a claim that a version has already been published.

## GitHub automation

The pinned Release Please workflow runs after CI succeeds for a push to this repository's `main` branch. It opens or updates a release PR containing the computed version and changelog. A maintainer reviews and merges that PR; after CI succeeds on the merge, the next run creates the GitHub tag/release. The release job checks the source repository and push event, and executes no code or artifacts from pull requests. Root commits and squash-merge titles must follow Conventional Commits for automatic version calculation.

GitHub's repository setting permitting Actions to create pull requests must be enabled. GitHub combines creation and review approval in one setting; our workflow does not approve or merge. With the default `GITHUB_TOKEN`, bot-created PRs may not trigger other workflows automatically. A maintainer can run CI via manual dispatch on the release branch, or configure a dedicated GitHub App token later if automatic checks on bot-created PRs are required. No credential is embedded in source.

## First npm publication

GitHub releases do not publish to npm in this setup. An npm owner must claim the package names and choose the publisher/authentication settings. Once ready:

```sh
npm ci
npm run check
npm publish --workspace string-lights --access public
npm publish --workspace string-lights-react --access public
```

Publish core first so the React dependency resolves. For subsequent CI publication, configure [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for this repository and the exact publishing workflow. Trusted publishing/provenance requires registry-side setup and is not enabled by merely committing a workflow. Never put tokens in committed files. Verify npm name ownership and version availability at release time.
