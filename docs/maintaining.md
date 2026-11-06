# Building and releasing

Use Node 22 or 24. See [Contributing](../CONTRIBUTING.md) for setup and checks. Edit the core in `src/core/` and the React component in `src/react/StringLights.tsx`. Rebuild generated bundles, declarations and registry files instead of editing them directly.

## Build and test packages

Run from the repository root:

```sh
npm ci
npm run build
npm run test:packages
npm pack ./packages/string-lights-core --pack-destination ./artifacts
npm pack ./packages/string-lights-react --pack-destination ./artifacts
```

Build creates ESM bundles, source maps, TypeScript declarations and MIT license copies. Package preparation runs the build automatically. Use the filenames printed by `npm pack` when installing or publishing; their versions come from the package manifests. Install both local tarballs together to test React against an unpublished core version.

Both packages are ESM and declare `sideEffects: false`. The core has no runtime dependencies or global CSS. React 18 and 19 are supported. Imports are SSR-safe; create a renderer only after mounting its DOM target.

Package checks install archives in an isolated consumer and verify file lists, licenses, SSR, TypeScript imports, tree shaking, bundle budgets and registry/source parity. `npm run check` also runs lint, unit tests and browser tests.

## Copyable shadcn component

Build writes `registry/public/r/string-lights.json` and the source files it embeds. With the local preview running, install into an initialized shadcn app:

```sh
npm run dev
# In the consuming app:
npx shadcn@latest add http://127.0.0.1:8770/r/string-lights.json
```

The item installs `components/ui/string-lights.tsx` and `lib/string-lights.js` with its declarations, respecting the app's configured aliases. It has no npm renderer dependency, Tailwind configuration, or CSS dependency. Manual installation works by copying the generated TSX to your UI folder and the engine JS/declarations to your lib folder, then adjusting the `@/lib/string-lights` import.

```tsx
import { StringLights } from '@/components/ui/string-lights';
import { stringLightsPresets } from '@/lib/string-lights';

<StringLights options={stringLightsPresets.white.options} className="relative min-h-80">
  <h2>Celebrate together</h2>
</StringLights>;
```

Host `registry/public/r` at your own public URL to distribute the registry. Its [format follows shadcn's registry item schema](https://ui.shadcn.com/docs/registry/registry-item-json). Do not edit generated registry files directly; rebuild from `src/`.

## Versioning

Both packages share one version. `release-please-config.json` treats the repository root as one release unit and synchronizes package versions, the React-to-core dependency and workspace lock entries. `.release-please-manifest.json` records the release baseline. Package manifests describe the checked-out version; npm records the published versions.

| Commit                                                    | Version change                                              |
| --------------------------------------------------------- | ----------------------------------------------------------- |
| `fix:` or `perf:`                                         | Patch                                                       |
| `feat:`                                                   | Minor                                                       |
| `!` or a `BREAKING CHANGE:` footer                        | Major, including before 1.0 under the current configuration |
| Documentation, tests or tooling without a breaking marker | No automatic release                                        |

`npm run version:auto` previews a version from commits since the latest `v*` tag. It does not modify files, commit, tag or publish.

## Release automation

When GitHub Actions is enabled, Release Please runs after successful CI on a push to this repository's `main` branch. It opens or updates a version PR. Review and merge that PR before the workflow creates its tag and GitHub release. The workflow does not approve or merge PRs, run pull-request code, or publish to npm.

GitHub combines permission to create and approve PRs in one repository toggle; the release workflow needs creation permission. With `GITHUB_TOKEN`, bot-created PRs may need CI started manually through workflow dispatch on the release branch.

Disabling Actions pauses CI and release automation. Maintainers can still build, verify and publish locally.

## Publish to npm

1. Run `npm run check` and review the changelog and version changes.
2. Verify both package versions are unused on npm and that the React dependency points to the intended core version.
3. Commit and push the release changes.
4. Authenticate as an npm package owner and publish core first, then React:

```sh
npm publish --workspace string-lights --access public
npm publish --workspace string-lights-react --access public
```

Alternatively, publish the exact archives verified by `npm run test:packages` from `.recovery/tarballs/`. npm may require browser approval and registry processing time. Verify each public version and integrity, then install both from npm in a separate consumer and check JavaScript, React and CDN examples.

Keep package manifests, the Release Please baseline, changelog and GitHub release tags consistent. GitHub releases do not publish npm packages in this setup. Automated npm publication would require a publishing workflow and registry-side trusted-publisher configuration. Never commit npm tokens.
