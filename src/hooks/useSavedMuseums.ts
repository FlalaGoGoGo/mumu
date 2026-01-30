import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface SavedMuseum {
  museum_id: string;
  name: string;
  city: string;
  state: string | null;
  image_url: string | null;
  website_url: string | null;
  lat: number;
  lng: number;
  saved_at: string;
}

const STORAGE_KEY = 'mumu_saved_museums';

function loadFromStorage(): SavedMuseum[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(museums: SavedMuseum[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(museums));
}

export function useSavedMuseums() {
  const [savedMuseums, setSavedMuseums] = useState<SavedMuseum[]>(() => loadFromStorage());

  // Sync with localStorage on mount and listen for changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSavedMuseums(loadFromStorage());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isSaved = useCallback((museumId: string): boolean => {
    return savedMuseums.some(m => m.museum_id === museumId);
  }, [savedMuseums]);

  const saveMuseum = useCallback((museum: {
    museum_id: string;
    name: string;
    city: string;
    state: string | null;
    hero_image_url: string | null;
    website_url: string | null;
    lat: number;
    lng: number;
  }) => {
    setSavedMuseums(prev => {
      // Prevent duplicates
      if (prev.some(m => m.museum_id === museum.museum_id)) {
        return prev;
      }
      
      const newSaved: SavedMuseum = {
        museum_id: museum.museum_id,
        name: museum.name,
        city: museum.city,
        state: museum.state,
        image_url: museum.hero_image_url,
        website_url: museum.website_url,
        lat: museum.lat,
        lng: museum.lng,
        saved_at: new Date().toISOString(),
      };
      
      const updated = [newSaved, ...prev];
      saveToStorage(updated);
      return updated;
    });

    toast({
      title: "Saved",
      description: `${museum.name} added to your favorites`,
    });
  }, []);

  const removeMuseum = useCallback((museumId: string) => {
    let removedName = '';
    setSavedMuseums(prev => {
      const museum = prev.find(m => m.museum_id === museumId);
      removedName = museum?.name || 'Museum';
      const updated = prev.filter(m => m.museum_id !== museumId);
      saveToStorage(updated);
      return updated;
    });

    toast({
      title: "Removed",
      description: `${removedName} removed from favorites`,
    });
  }, []);

  const toggleSave = useCallback((museum: {
    museum_id: string;
    name: string;
    city: string;
    state: string | null;
    hero_image_url: string | null;
    website_url: string | null;
    lat: number;
    lng: number;
  }) => {
    if (isSaved(museum.museum_id)) {
      removeMuseum(museum.museum_id);
    } else {
      saveMuseum(museum);
    }
  }, [isSaved, saveMuseum, removeMuseum]);

  const clearAll = useCallback(() => {
    setSavedMuseums([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Sorted by saved_at descending (most recent first)
  const sortedSavedMuseums = [...savedMuseums].sort(
    (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
  );

  return {
    savedMuseums: sortedSavedMuseums,
    savedCount: savedMuseums.length,
    isSaved,
    saveMuseum,
    removeMuseum,
    toggleSave,
    clearAll,
  };
}
