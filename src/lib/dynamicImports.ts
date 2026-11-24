/**
 * Helper for dynamic imports to reduce initial bundle size.
 * Use these loaders to lazy-load heavy libraries only when needed.
 *
 * Example:
 *   const { default: Gantt } = await loadFrappeGantt();
 *   const yjs = await loadYjs();
 */

export const loadFrappeGantt = () => import('frappe-gantt');

export const loadYjs = () => import('yjs');

export const loadYWebsocket = () => import('y-websocket');

export const loadYIndexeddb = () => import('y-indexeddb');

// Combined loader for yjs providers (websocket + indexeddb)
export async function loadYProviders() {
  const [yjs, { WebsocketProvider }, { IndexeddbPersistence }] = await Promise.all([
    import('yjs'),
    import('y-websocket'),
    import('y-indexeddb'),
  ]);
  return { yjs, WebsocketProvider, IndexeddbPersistence };
}

// Lazy loader for Tiptap editor (heavy)
export const loadTiptap = () => import('@tiptap/react');

// Lazy loader for lowlight (syntax highlighting)
export const loadLowlight = () => import('lowlight');
