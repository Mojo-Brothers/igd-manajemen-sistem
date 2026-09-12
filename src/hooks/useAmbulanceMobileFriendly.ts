import { useState, useEffect } from 'react';

/**
 * Utility to detect if current device is a mobile phone / tablet.
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSmallScreen = window.innerWidth <= 820 || (window.screen && window.screen.width <= 820);
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  return isMobileUA || (isSmallScreen && isTouch) || isSmallScreen;
};

/**
 * Hook to manage Mobile-Friendly vs Desktop Widescreen view mode for Ambulance Front Page.
 * Default is mobile-friendly when accessed via mobile phone.
 */
export const useAmbulanceMobileFriendly = () => {
  const [isMobileFriendly, setIsMobileFriendly] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ambulance_mobile_friendly');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
    // Default: mobile friendly if accessed via mobile phone, else true
    return isMobileDevice();
  });

  // Dynamically update viewport meta tag to support desktop-enforced vs fluid mobile view
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'viewport';
      document.head.appendChild(metaTag);
    }

    if (isMobileFriendly) {
      metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
    } else {
      // Force mobile browsers to render widescreen desktop view (PC View)
      metaTag.content = 'width=1240, user-scalable=yes';
    }

    return () => {
      // Restore default mobile viewport on cleanup so other pages remain normal
      if (metaTag) {
        metaTag.content = 'width=device-width, initial-scale=1.0';
      }
    };
  }, [isMobileFriendly]);

  const updateMobileFriendly = (enabled: boolean) => {
    setIsMobileFriendly(enabled);
    try {
      localStorage.setItem('ambulance_mobile_friendly', String(enabled));
    } catch {
      // ignore
    }
  };

  const toggleMobileFriendly = () => {
    updateMobileFriendly(!isMobileFriendly);
  };

  return {
    isMobileFriendly,
    setMobileFriendly: updateMobileFriendly,
    toggleMobileFriendly,
    wrapperClass: isMobileFriendly ? 'w-full' : 'min-w-[1240px] overflow-x-auto',
    containerClass: isMobileFriendly ? 'w-full max-w-7xl' : 'w-[1240px]',
  };
};
