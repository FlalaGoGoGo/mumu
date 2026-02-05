 import { useState, useCallback, useRef, useEffect } from 'react';
 
 interface UseSpeechSynthesisOptions {
   rate?: number;
   pitch?: number;
   lang?: string;
 }
 
 export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
   const { rate = 0.9, pitch = 1, lang = 'en-US' } = options;
   const [isSpeaking, setIsSpeaking] = useState(false);
   const [isPaused, setIsPaused] = useState(false);
   const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
 
   // Clean up on unmount
   useEffect(() => {
     return () => {
       if (typeof window !== 'undefined' && window.speechSynthesis) {
         window.speechSynthesis.cancel();
       }
     };
   }, []);
 
   const speak = useCallback((text: string) => {
     if (typeof window === 'undefined' || !window.speechSynthesis) {
       console.warn('Speech synthesis not supported');
       return;
     }
 
     // Cancel any ongoing speech
     window.speechSynthesis.cancel();
 
     const utterance = new SpeechSynthesisUtterance(text);
     utterance.rate = rate;
     utterance.pitch = pitch;
     utterance.lang = lang;
 
     utterance.onstart = () => {
       setIsSpeaking(true);
       setIsPaused(false);
     };
 
     utterance.onend = () => {
       setIsSpeaking(false);
       setIsPaused(false);
     };
 
     utterance.onerror = () => {
       setIsSpeaking(false);
       setIsPaused(false);
     };
 
     utteranceRef.current = utterance;
     window.speechSynthesis.speak(utterance);
   }, [rate, pitch, lang]);
 
   const pause = useCallback(() => {
     if (window.speechSynthesis) {
       window.speechSynthesis.pause();
       setIsPaused(true);
     }
   }, []);
 
   const resume = useCallback(() => {
     if (window.speechSynthesis) {
       window.speechSynthesis.resume();
       setIsPaused(false);
     }
   }, []);
 
   const stop = useCallback(() => {
     if (window.speechSynthesis) {
       window.speechSynthesis.cancel();
       setIsSpeaking(false);
       setIsPaused(false);
     }
   }, []);
 
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
     isSpeaking,
     isPaused,
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