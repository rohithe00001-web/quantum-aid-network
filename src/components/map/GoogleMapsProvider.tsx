import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LoadScript } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded globally
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const fetchApiKey = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-google-maps-key`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const data = await response.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setError(data.error || 'Failed to load API key');
        }
      } catch (err) {
        console.error('Failed to fetch Google Maps API key:', err);
        setError('Failed to load map configuration');
      }
    };
    fetchApiKey();
  }, []);

  if (error) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: error }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: null }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <LoadScript 
      googleMapsApiKey={apiKey}
      onLoad={() => setIsLoaded(true)}
      onError={() => setError('Failed to load Google Maps')}
    >
      <GoogleMapsContext.Provider value={{ isLoaded, loadError: error }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
}
