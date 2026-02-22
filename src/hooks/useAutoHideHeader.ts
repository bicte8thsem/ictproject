import { useEffect, useRef, useState } from 'react';

export function useAutoHideHeader() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;

      // Keep header visible near the top for better UX.
      if (currentY < 24) {
        setIsVisible(true);
        lastScrollY.current = currentY;
        return;
      }

      if (currentY > lastScrollY.current) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return isVisible;
}

