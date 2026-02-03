import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface CollectedArtwork {
  artwork_id: string;
  title: string;
  artist_name: string;
  year: string;
  image_url: string | null;
  museum_name: string;
  collected_at: string;
}

const STORAGE_KEY = 'mumu_collected_artworks';

function loadFromStorage(): CollectedArtwork[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(artworks: CollectedArtwork[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(artworks));
}

export function useCollectedArtworks() {
  const [collectedArtworks, setCollectedArtworks] = useState<CollectedArtwork[]>(() => loadFromStorage());

  // Sync with localStorage on mount and listen for changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setCollectedArtworks(loadFromStorage());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isCollected = useCallback((artworkId: string): boolean => {
    return collectedArtworks.some(a => a.artwork_id === artworkId);
  }, [collectedArtworks]);

  const collectArtwork = useCallback((artwork: {
    artwork_id: string;
    title: string;
    artist_name: string;
    year: string;
    image_url: string | null;
    museum_name: string;
  }) => {
    // Use functional state update to avoid stale state issues
    setCollectedArtworks(prev => {
      // Prevent duplicates
      if (prev.some(a => a.artwork_id === artwork.artwork_id)) {
        return prev;
      }
      
      const newCollected: CollectedArtwork = {
        artwork_id: artwork.artwork_id,
        title: artwork.title,
        artist_name: artwork.artist_name,
        year: artwork.year,
        image_url: artwork.image_url,
        museum_name: artwork.museum_name,
        collected_at: new Date().toISOString(),
      };
      
      const updated = [newCollected, ...prev];
      // Save to storage inside the functional update to ensure we have the latest state
      saveToStorage(updated);
      return updated;
    });

    toast({
      title: "Saved to Passport",
      description: `"${artwork.title}" added to your collection`,
    });
  }, []);

  const removeArtwork = useCallback((artworkId: string) => {
    let removedTitle = '';
    // Use functional state update to avoid stale state issues
    setCollectedArtworks(prev => {
      const artwork = prev.find(a => a.artwork_id === artworkId);
      removedTitle = artwork?.title || 'Artwork';
      const updated = prev.filter(a => a.artwork_id !== artworkId);
      // Save to storage inside the functional update
      saveToStorage(updated);
      return updated;
    });

    toast({
      title: "Removed from Passport",
      description: `"${removedTitle}" removed from your collection`,
    });
  }, []);

  const toggleCollect = useCallback((artwork: {
    artwork_id: string;
    title: string;
    artist_name: string;
    year: string;
    image_url: string | null;
    museum_name: string;
  }) => {
    // Read current state directly from localStorage to avoid stale closure
    const currentState = loadFromStorage();
    const isCurrentlyCollected = currentState.some(a => a.artwork_id === artwork.artwork_id);
    
    if (isCurrentlyCollected) {
      removeArtwork(artwork.artwork_id);
    } else {
      collectArtwork(artwork);
    }
  }, [collectArtwork, removeArtwork]);

  const clearAll = useCallback(() => {
    setCollectedArtworks([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Sorted by collected_at descending (most recent first)
  const sortedCollectedArtworks = [...collectedArtworks].sort(
    (a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime()
  );

  return {
    collectedArtworks: sortedCollectedArtworks,
    collectedCount: collectedArtworks.length,
    isCollected,
    collectArtwork,
    removeArtwork,
    toggleCollect,
    clearAll,
  };
}
