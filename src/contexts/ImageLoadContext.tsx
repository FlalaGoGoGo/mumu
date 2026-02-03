import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface ImageLoadContextType {
  // Track which artwork IDs have images that loaded successfully
  loadedImageIds: Set<string>;
  // Track which artwork IDs have images that failed to load
  failedImageIds: Set<string>;
  // Report a successful image load
  reportImageLoaded: (artworkId: string) => void;
  // Report a failed image load
  reportImageFailed: (artworkId: string) => void;
  // Check if an artwork has a verified loaded image
  hasVerifiedImage: (artworkId: string) => boolean;
  // Check if we've attempted to load this artwork's image
  hasAttemptedLoad: (artworkId: string) => boolean;
}

const ImageLoadContext = createContext<ImageLoadContextType | null>(null);

export function ImageLoadProvider({ children }: { children: React.ReactNode }) {
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set());
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const reportImageLoaded = useCallback((artworkId: string) => {
    setLoadedImageIds(prev => {
      if (prev.has(artworkId)) return prev;
      const next = new Set(prev);
      next.add(artworkId);
      return next;
    });
    // Remove from failed if it was there (retry succeeded)
    setFailedImageIds(prev => {
      if (!prev.has(artworkId)) return prev;
      const next = new Set(prev);
      next.delete(artworkId);
      return next;
    });
  }, []);

  const reportImageFailed = useCallback((artworkId: string) => {
    setFailedImageIds(prev => {
      if (prev.has(artworkId)) return prev;
      const next = new Set(prev);
      next.add(artworkId);
      return next;
    });
  }, []);

  const hasVerifiedImage = useCallback((artworkId: string) => {
    return loadedImageIds.has(artworkId);
  }, [loadedImageIds]);

  const hasAttemptedLoad = useCallback((artworkId: string) => {
    return loadedImageIds.has(artworkId) || failedImageIds.has(artworkId);
  }, [loadedImageIds, failedImageIds]);

  const value = useMemo(() => ({
    loadedImageIds,
    failedImageIds,
    reportImageLoaded,
    reportImageFailed,
    hasVerifiedImage,
    hasAttemptedLoad,
  }), [loadedImageIds, failedImageIds, reportImageLoaded, reportImageFailed, hasVerifiedImage, hasAttemptedLoad]);

  return (
    <ImageLoadContext.Provider value={value}>
      {children}
    </ImageLoadContext.Provider>
  );
}

export function useImageLoad() {
  const context = useContext(ImageLoadContext);
  if (!context) {
    throw new Error('useImageLoad must be used within an ImageLoadProvider');
  }
  return context;
}
