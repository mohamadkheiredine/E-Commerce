import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const SYSTEM_CREATED_ATTR = 'data-portal-system-created';

/**
 * Idempotent: returns the existing wrapper if present, so repeated snapshot reads
 * yield the same element reference (a requirement of useSyncExternalStore).
 */
const getOrCreateWrapper = (wrapperId: string): HTMLElement => {
  const existing = document.getElementById(wrapperId);
  if (existing) return existing;

  const element = document.createElement('div');
  element.id = wrapperId;
  element.setAttribute(SYSTEM_CREATED_ATTR, 'true');
  document.body.appendChild(element);
  return element;
};

const subscribe = () => () => {};

function ReactPortal({ children, wrapperId }: { children: React.ReactElement; wrapperId: string }) {
  // The DOM is the external system here. On the server there is no document, so the
  // snapshot is null and nothing renders; on the client the wrapper resolves synchronously
  // on first render — no extra state, no effect-driven re-render.
  const wrapperElement = useSyncExternalStore(
    subscribe,
    () => getOrCreateWrapper(wrapperId),
    () => null,
  );

  useEffect(() => {
    return () => {
      const element = document.getElementById(wrapperId);
      if (element?.getAttribute(SYSTEM_CREATED_ATTR) === 'true') {
        element.remove();
      }
    };
  }, [wrapperId]);

  if (!wrapperElement) return null;

  return createPortal(children, wrapperElement);
}

export default ReactPortal;
