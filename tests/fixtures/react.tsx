import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { StringLights } from '../../src/react/StringLights';

declare global {
  interface Window {
    rerender: () => void;
    unmount: () => void;
    fullPage: () => void;
  }
}
function App() {
  const [count, setCount] = useState(0);
  const [fullPage, setFullPage] = useState(false);
  window.rerender = () => flushSync(() => setCount((value) => value + 1));
  window.fullPage = () => flushSync(() => setFullPage((value) => !value));
  return (
    <StringLights
      options={{ mode: 'blink', breeze: false, shape: ['rice', 'round'] }}
      fullPage={fullPage}
      data-react-host
      style={{ height: 300, width: 320, position: 'static' }}
    >
      {String(count)}
    </StringLights>
  );
}
const root = createRoot(document.getElementById('root')!);
window.unmount = () => flushSync(() => root.unmount());
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
