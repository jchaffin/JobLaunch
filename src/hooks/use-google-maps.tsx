'use client';

import { useEffect, useState } from 'react';

interface UseGoogleMapsOptions {
  libraries?: string[];
}

export function useGoogleMaps(options: UseGoogleMapsOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Check if already loaded
    if (typeof window !== 'undefined' && window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    const libraries = options.libraries?.join(',') || 'places';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      setError(null);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps API');
      setIsLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Clean up script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [options.libraries]);

  return { isLoaded, error };
}