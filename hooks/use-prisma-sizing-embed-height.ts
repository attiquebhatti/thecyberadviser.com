'use client';

import { useEffect } from 'react';

export function usePrismaSizingEmbedHeight(enabled: boolean, deps: unknown[] = []) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || window.parent === window) {
      return;
    }

    const postHeight = () => {
      window.requestAnimationFrame(() => {
        const height = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );

        window.parent.postMessage(
          {
            type: 'prisma-sizing:height',
            height,
          },
          '*'
        );
      });
    };

    postHeight();

    const observer = new ResizeObserver(() => postHeight());
    observer.observe(document.body);
    window.addEventListener('resize', postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', postHeight);
    };
  }, [enabled, ...deps]);
}
