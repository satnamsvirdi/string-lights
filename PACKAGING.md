# Package and registry distribution

## Build npm packages

From the repository root, with Node 22 or 24:

```sh
npm ci
npm run build
npm pack ./packages/string-lights-core --pack-destination ./artifacts
npm pack ./packages/string-lights-react --pack-destination ./artifacts
```

The `artifacts` directory is tracked and already exists. Build creates the ESM bundles, source maps, declarations, and MIT license copies. Package preparation runs the same build automatically. The current version is in each package manifest; npm names the tarballs `string-lights-VERSION.tgz` and `string-lights-react-VERSION.tgz`. For version 0.1.0:

```sh
npm install ./artifacts/string-lights-0.1.0.tgz ./artifacts/string-lights-react-0.1.0.tgz
```

The React package depends on the core and declares React 18 or 19 as a peer. Install both tarballs together while the core is unpublished. The core needs no runtime dependencies or global CSS. Both packages are ESM only; supported bundlers can remove unused exports because the packages declare `sideEffects: false` and preserve ESM exports. SSR imports do not access the DOM. Native browser script users can serve `packages/string-lights-core/dist/index.js` over HTTP and import from that URL.

`npm run test:packages` installs packed artifacts in an isolated fixture and verifies their file lists, license, SSR, strict consumer types, registry parity, and measured bundle budgets. It requires `npm run build` first; `npm run check` runs them in order.

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

## Publishing

Nothing in the local build or CI publishes to npm. See [RELEASING.md](RELEASING.md) for automated versions and the npm owner setup required before first publication. Package names were unclaimed when checked on November 5, 2026; that check does not reserve them.
