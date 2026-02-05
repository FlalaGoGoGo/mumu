 import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
 
 interface UseSpeechSynthesisOptions {
   rate?: number;
   pitch?: number;
   lang?: string;
   onBoundaryUpdate?: (charIndex: number) => void;
 }
 
 interface SpeechState {
   fullText: string;
   baseOffset: number;
   currentCharIndex: number;
 }
 
 export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
   const { rate = 0.9, pitch = 1, lang = 'en-US' } = options;
   const [isSpeaking, setIsSpeaking] = useState(false);
   const [isPaused, setIsPaused] = useState(false);
   const [progress, setProgress] = useState(0);
   const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
   const speechStateRef = useRef<SpeechState>({ fullText: '', baseOffset: 0, currentCharIndex: 0 });
   const boundarySupported = useRef(true);
   const fallbackTimerRef = useRef<number | null>(null);
 
 
   // Estimate characters per second for fallback (average speaking rate)
   const CHARS_PER_SECOND = 15;
 
   const clearFallbackTimer = useCallback(() => {
     if (fallbackTimerRef.current !== null) {
       window.clearInterval(fallbackTimerRef.current);
       fallbackTimerRef.current = null;
     }
   }, []);
 
   const startFallbackTimer = useCallback((startChar: number, fullLength: number) => {
     clearFallbackTimer();
     const startTime = Date.now();
     fallbackTimerRef.current = window.setInterval(() => {
       const elapsed = (Date.now() - startTime) / 1000;
       const estimatedChar = startChar + Math.floor(elapsed * CHARS_PER_SECOND * rate);
       const clampedChar = Math.min(estimatedChar, fullLength);
       const newProgress = fullLength > 0 ? (clampedChar / fullLength) * 100 : 0;
       setProgress(Math.min(newProgress, 100));
       speechStateRef.current.currentCharIndex = clampedChar;
     }, 100);
   }, [rate, clearFallbackTimer]);
 
   // Clean up on unmount
   useEffect(() => {
     return () => {
       clearFallbackTimer();
       if (typeof window !== 'undefined' && window.speechSynthesis) {
         window.speechSynthesis.cancel();
       }
     };
   }, [clearFallbackTimer]);
 
 
   const speakFromOffset = useCallback((fullText: string, startOffset: number = 0) => {
     if (typeof window === 'undefined' || !window.speechSynthesis) {
       console.warn('Speech synthesis not supported');
       return;
     }
 
     // Cancel any ongoing speech
     window.speechSynthesis.cancel();
     clearFallbackTimer();
 
     const textToSpeak = startOffset > 0 ? fullText.slice(startOffset) : fullText;
     if (!textToSpeak.trim()) {
       setProgress(100);
       return;
     }
 
     speechStateRef.current = {
       fullText,
       baseOffset: startOffset,
       currentCharIndex: startOffset,
     };
 
     const utterance = new SpeechSynthesisUtterance(textToSpeak);
     utterance.rate = rate;
     utterance.pitch = pitch;
     utterance.lang = lang;
 
     let boundaryFired = false;
 
     utterance.onboundary = (event) => {
       boundaryFired = true;
       const absoluteChar = speechStateRef.current.baseOffset + event.charIndex;
       speechStateRef.current.currentCharIndex = absoluteChar;
       const newProgress = (absoluteChar / fullText.length) * 100;
       setProgress(Math.min(newProgress, 100));
     };
 
     utterance.onstart = () => {
       setIsSpeaking(true);
       setIsPaused(false);
       // Start fallback timer in case onboundary doesn't fire
       setTimeout(() => {
         if (!boundaryFired && speechStateRef.current.fullText) {
           boundarySupported.current = false;
           startFallbackTimer(startOffset, fullText.length);
         }
       }, 500);
     };
 
     utterance.onend = () => {
       setIsSpeaking(false);
       setIsPaused(false);
       setProgress(100);
       clearFallbackTimer();
     };
 
     utterance.onerror = (e) => {
       // 'interrupted' is not a real error, just means we cancelled
       if (e.error !== 'interrupted') {
         setIsSpeaking(false);
         setIsPaused(false);
       }
       clearFallbackTimer();
     };
 
     utteranceRef.current = utterance;
     window.speechSynthesis.speak(utterance);
   }, [rate, pitch, lang, clearFallbackTimer, startFallbackTimer]);
 
   const speak = useCallback((text: string) => {
     setProgress(0);
     speakFromOffset(text, 0);
   }, [speakFromOffset]);
 
   const seekTo = useCallback((percentage: number) => {
     const { fullText } = speechStateRef.current;
     if (!fullText) return;
     
     const targetChar = Math.floor((percentage / 100) * fullText.length);
     setProgress(percentage);
     speakFromOffset(fullText, targetChar);
   }, [speakFromOffset]);
 
 
   const pause = useCallback(() => {
     if (window.speechSynthesis) {
       window.speechSynthesis.pause();
       setIsPaused(true);
       clearFallbackTimer();
     }
   }, [clearFallbackTimer]);
 
 
   const resume = useCallback(() => {
     if (window.speechSynthesis) {
       window.speechSynthesis.resume();
       setIsPaused(false);
       // Restart fallback timer if boundary not supported
       if (!boundarySupported.current) {
         const { currentCharIndex, fullText } = speechStateRef.current;
         startFallbackTimer(currentCharIndex, fullText.length);
       }
     }
   }, [startFallbackTimer]);
 
 
   const stop = useCallback(() => {
     clearFallbackTimer();
     if (window.speechSynthesis) {
       window.speechSynthesis.cancel();
       setIsSpeaking(false);
       setIsPaused(false);
       setProgress(0);
       speechStateRef.current = { fullText: '', baseOffset: 0, currentCharIndex: 0 };
     }
   }, [clearFallbackTimer]);
 
   const toggle = useCallback(() => {
     if (isPaused) {
       resume();
     } else if (isSpeaking) {
       pause();
     }
   }, [isPaused, isSpeaking, pause, resume]);
 
 
   return {
     speak,
     pause,
     resume,
     stop,
     toggle,
     seekTo,
     isSpeaking,
     isPaused,
     progress,
     isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
   };
 }
 
 // Generate speech script for an artwork
 export function generateArtworkSpeechScript(artwork: {
   title: string;
   artist_name?: string;
   year?: string;
   movement?: string;
   highlight?: boolean;
 }): string {
   const parts: string[] = [];
   
   // Title and artist
   if (artwork.artist_name) {
     parts.push(`${artwork.title}, by ${artwork.artist_name}`);
   } else {
     parts.push(artwork.title);
   }
   
   // Year
   if (artwork.year) {
     parts.push(artwork.year);
   }
   
   // Movement (if available)
   if (artwork.movement) {
     parts.push(`Movement: ${artwork.movement}`);
   }
   
   // Highlight note
   if (artwork.highlight) {
     parts.push('This is a must-see highlight.');
   }
   
   return parts.join('. ') + '.';
 }