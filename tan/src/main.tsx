import { StrictMode } from 'react';

import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import 'agent-react-devtools/connect';
import ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen';

const isElectron = !!(window as unknown as Record<string, unknown>).electronAPI;

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  history: isElectron ? createHashHistory() : undefined,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
