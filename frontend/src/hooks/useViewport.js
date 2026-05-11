import { useEffect, useState } from 'react';

function readViewport() {
  if (typeof window === 'undefined') {
    return { width: 1280, isMobile: false, isTablet: false, isDesktop: true };
  }

  const width = window.innerWidth;
  return {
    width,
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

export default function useViewport() {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return viewport;
}
