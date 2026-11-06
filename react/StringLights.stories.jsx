import React from 'react';
import StringLights from './StringLights.jsx';
export default {
  title: 'Effects/StringLights',
  component: StringLights,
  args: { options: { mode: 'fade', colors: 'multicolor' } },
};
export const Component = {
  render: (args) => (
    <StringLights
      {...args}
      style={{ minHeight: 340, background: '#111', color: '#eee', padding: 80 }}
    >
      <h1>A little light, everywhere.</h1>
      <button onClick={(e) => (e.currentTarget.textContent = 'Clicked through the lights')}>
        Try this button
      </button>
    </StringLights>
  ),
};
export const WhiteCurtain = {
  ...Component,
  args: { options: { layout: 'curtain', colors: 'white', mode: 'wave' } },
};
export const FullPage = {
  ...Component,
  args: { fullPage: true, options: { layout: 'roofline', mode: 'chase', glitter: true } },
};

export const MixedBulbs = {
  ...Component,
  args: {
    options: { shape: ['rice', 'round', 'flower', 'crystal'], mode: 'fade', dimBase: true },
  },
};
export const TimedPatterns = {
  ...Component,
  args: {
    options: {
      shape: ['rice', 'round'],
      patternOrder: 'cycle',
      patternInterval: 3,
      patternSequence: ['blink', 'chase', 'wave', 'fade'],
    },
  },
};
export const IndependentStrings = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 24,
      }}
    >
      <StringLights
        options={{
          layout: 'roofline',
          shape: ['rice', 'flower'],
          colors: 'multicolor',
          patternOrder: 'random',
          patternInterval: 3,
          seed: 17,
        }}
        style={{ minHeight: 320, padding: 72, background: '#111', color: '#eee' }}
      >
        <h2>Random patterns</h2>
        <p>Mixed rice and flower bulbs.</p>
      </StringLights>
      <StringLights
        options={{
          layout: 'border',
          shape: ['round', 'crystal'],
          colors: 'white',
          patternOrder: 'cycle',
          patternInterval: 5,
          patternSequence: ['wave', 'fade', 'blink'],
        }}
        style={{ minHeight: 320, padding: 72, background: '#1b1b1b', color: '#eee' }}
      >
        <h2>A separate rhythm</h2>
        <p>Its own five-second pattern clock.</p>
      </StringLights>
    </div>
  ),
};
