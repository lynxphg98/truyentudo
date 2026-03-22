import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Shim to prevent libraries from overwriting fetch and causing errors
if (typeof window !== 'undefined') {
  try {
    const originalFetch = `globalThis`
    // We try to redefine fetch with a no-op setter to avoid "only a getter" errors
    Object.defineProperty(window, 'fetch', {
      get() { return originalFetch; },
      set() { console.warn('Something tried to overwrite window.fetch. This was prevented to avoid errors.'); },
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    // If it's not configurable, we can't do much here
    console.warn('Could not redefine window.fetch:', e);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
createRoot(rootElement).render(

  <StrictMode>
    <App />
  </StrictMode>
);
