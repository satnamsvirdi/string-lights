# Contributing

Use Node 22 or 24. Clone the repository, run `npm ci`, then install Playwright's browsers with `npx playwright install chromium firefox webkit`. On Linux, use `npx playwright install --with-deps chromium firefox webkit` to include system dependencies.

Run `npm run dev` for the visual editor. Edit `src/core/` or the canonical component in `src/react/StringLights.tsx`; avoid editing generated registry or package bundles. Update the core declaration contract for public API changes.

Before submitting:

```sh
npm run format
npm run check
git diff --check
```

Add tests that exercise observable behavior for correctness or performance fixes. Geometry and solver tests belong in `tests/unit/` or `StringLights.test.mjs`; real browser behavior belongs in `tests/browser/`. Test mixed bulbs, reduced motion, independent instances, cleanup, and nested React content when relevant. Bundle budgets live in `performance-budgets.json`; explain any intentional increase with measured evidence.

Use Conventional Commits for commits and squash-merge PR titles. `fix:` and `perf:` produce patch releases, `feat:` produces minor releases, and `!` or a `BREAKING CHANGE:` footer produces a major release. `docs:`, `test:`, `ci:`, `build:`, `refactor:`, and `chore:` describe changes that do not alter the public behavior unless marked breaking. Run `npm run version:auto` to preview the next version locally.

Keep changes focused and explain the user-visible behavior and verification. Code of conduct: treat other contributors respectfully, discuss code rather than people, and keep issue reports specific and reproducible.

For module responsibilities, see [Architecture](docs/architecture.md). Consumer setup is documented in [Installation](docs/installation.md).

`npm run build` regenerates the npm bundles, root `registry.json` and shadcn source files. `npm run test:packages` verifies packed installs and registry parity. Commit the generated registry changes with their source changes.
