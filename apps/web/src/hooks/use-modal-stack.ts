import { useEffect, useState } from 'react';

/**
 * Module-level registry of open modal z-indexes, so a dialog opened from inside
 * another dialog stacks above it instead of fighting for the same layer.
 */
const modalStack: number[] = [];
let nextZIndex = 50;

const allocate = () => (modalStack.length > 0 ? Math.max(...modalStack) + 10 : nextZIndex);

export function useModalStack() {
  // Computed once in the lazy initialiser (a pure read of the registry); the
  // registration itself — a side effect — belongs in the effect below.
  const [zIndex] = useState<number>(allocate);

  useEffect(() => {
    modalStack.push(zIndex);
    nextZIndex = zIndex + 10;

    return () => {
      const at = modalStack.indexOf(zIndex);
      if (at !== -1) modalStack.splice(at, 1);
      if (modalStack.length === 0) nextZIndex = 50;
    };
  }, [zIndex]);

  return { zIndex };
}

export function getTopModalZIndex(): number {
  return modalStack.length > 0 ? Math.max(...modalStack) : 50;
}

export function isModalStackEmpty(): boolean {
  return modalStack.length === 0;
}
