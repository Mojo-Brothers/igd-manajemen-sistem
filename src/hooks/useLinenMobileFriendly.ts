import { useState, useEffect } from 'react';
import { 
  subscribeLinenMobileFriendly, 
  setLinenMobileFriendly, 
  DEFAULT_MOBILE_FRIENDLY 
} from '../services/linenService';

export const useLinenMobileFriendly = () => {
  const [isMobileFriendly, setIsMobileFriendly] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('linen_mobile_friendly');
      if (cached !== null) return cached === 'true';
    } catch {
      // ignore
    }
    return DEFAULT_MOBILE_FRIENDLY;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = subscribeLinenMobileFriendly((enabled) => {
      setIsMobileFriendly(enabled);
      setLoading(false);
      try {
        localStorage.setItem('linen_mobile_friendly', String(enabled));
      } catch {
        // ignore
      }
    });

    return () => unsub();
  }, []);

  // Dynamically update viewport meta tag to support desktop-enforced vs fluid mobile view
  useEffect(() => {
    let metaTag = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'viewport';
      document.head.appendChild(metaTag);
    }

    const previousContent = metaTag.content || 'width=device-width, initial-scale=1.0';

    if (isMobileFriendly) {
      metaTag.content = 'width=device-width, initial-scale=1.0';
    } else {
      // Force mobile browsers to render widescreen desktop view
      metaTag.content = 'width=1240, user-scalable=yes';
    }

    return () => {
      // Restore default mobile viewport on cleanup
      if (metaTag) {
        metaTag.content = previousContent || 'width=device-width, initial-scale=1.0';
      }
    };
  }, [isMobileFriendly]);

  const updateMobileFriendly = async (enabled: boolean, updatedBy?: string) => {
    setIsMobileFriendly(enabled);
    try {
      localStorage.setItem('linen_mobile_friendly', String(enabled));
    } catch {
      // ignore
    }
    await setLinenMobileFriendly(enabled, updatedBy);
  };

  return {
    isMobileFriendly,
    setMobileFriendly: updateMobileFriendly,
    loading,
    containerClass: isMobileFriendly ? 'w-full' : 'min-w-[1240px]'
  };
};
