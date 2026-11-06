# Installation

## JavaScript

```sh
npm install string-lights
```

```js
import { createStringLights } from 'string-lights';

const lights = createStringLights('#celebration', {
  layout: 'roofline',
  colors: 'warm',
  mode: 'fade',
});
```

Give the target a height or `min-height`. Call `lights.destroy()` when removing it. See [API and options](api.md) for layouts, shapes, rhythms and interaction controls.

## React

```sh
npm install string-lights-react
```

```tsx
import { StringLights } from 'string-lights-react';

export function Celebration() {
  return (
    <StringLights options={{ colors: 'warm' }} style={{ minHeight: 320 }}>
      <h2>Celebrate together</h2>
    </StringLights>
  );
}
```

The React package includes the core dependency, supports React 18 and 19, and cleans up when unmounted. In Next.js App Router, use it in a client component.

## Copyable shadcn component

Run this in an initialized shadcn project:

```sh
npx shadcn@latest add satnamsvirdi/string-lights/string-lights
```

The CLI reads the repository's root `registry.json` and installs `components/ui/string-lights.tsx`, `lib/string-lights.js` and its declarations into your configured aliases. You do not need to clone this repository, start its demo server or install the npm renderer packages.

The repository must be public for installation without GitHub credentials. While it remains private, only users with repository access can install through an authenticated GitHub CLI session.

```tsx
import { StringLights } from '@/components/ui/string-lights';
import { stringLightsPresets } from '@/lib/string-lights';

export function Celebration() {
  return (
    <StringLights options={stringLightsPresets.white.options} className="relative min-h-80">
      <h2>Celebrate together</h2>
    </StringLights>
  );
}
```

The component uses the copied local engine, with no runtime CSS or Tailwind configuration changes. You own the installed source and can edit it. For a repeatable installation, append a release tag or commit SHA to the GitHub item address.

See [shadcn GitHub registries](https://ui.shadcn.com/docs/registry/github) for CLI details.
