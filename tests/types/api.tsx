import { createElement } from 'react';
import { StringLights } from '../../src/react/StringLights';
import {
  createStringLights,
  createGeometry,
  stringLightsPresets,
  palettes,
  type StringOptions,
} from 'string-lights';
const options: StringOptions = {
  shape: ['rice', 'flower'],
  colors: 'white',
  pagePosition: 'absolute',
  animated: true,
  patternOrder: 'cycle',
  patternSequence: ['blink', 'wave'],
};
createGeometry(600, 300, options);
const lights = createStringLights(document.body, options);
lights.update({ speed: 1.4 });
lights.destroy();
createElement(StringLights, { options: stringLightsPresets.festive.options }, 'Celebrate');
// @ts-expect-error Reject invalid bulb shapes.
const invalidShape: StringOptions = { shape: 'unknown' };
// @ts-expect-error Palettes cannot be mutated globally.
palettes.white.push('#000');
void invalidShape;
