import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Standalone mount
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Hub mount contract
export function mount(container: HTMLElement, props: any) {
  // Inject style if needed
  const styleId = 'game-style-slugwars';
  if (!document.getElementById(styleId)) {
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.href = '/games/slugwars/style.css';
    document.head.appendChild(link);
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App {...props} isEmbedded={true} />
    </React.StrictMode>
  );

  return () => {
    setTimeout(() => {
      root.unmount();
    }, 0);
  };
}

(window as any).mountSlugwars = mount;
(window as any).mountSlugWars = mount;
