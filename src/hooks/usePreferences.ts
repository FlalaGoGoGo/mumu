import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getSessionClient } from '@/lib/supabaseSession';
import { useSession } from './useSession';

export interface UserPreferences {
  language: string;
  knowledge_level: string;
  visit_style: string;
  pace_preference: string;
  interests: string[];
  discounts: string[];
  show_eligible_discounts_only: boolean;
  remind_free_days: boolean;
  prefer_less_walking: boolean;
  prefer_elevator: boolean;
  kid_friendly_content: boolean;
  visit_reminders: boolean;
  nickname: string;
  gender: string;
  avatar_url: string;
  location_country: string;
  location_region: string;
  location_city: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'English',
  knowledge_level: 'Beginner',
  visit_style: 'Efficient Highlights',
  pace_preference: 'Normal',
  interests: [],
  discounts: [],
  show_eligible_discounts_only: true,
  remind_free_days: false,
  prefer_less_walking: false,
  prefer_elevator: false,
  kid_friendly_content: false,
  visit_reminders: false,
  nickname: '',
  gender: '',
  avatar_url: '',
  location_country: '',
  location_region: '',
  location_city: '',
};

const LOCAL_STORAGE_KEY = 'mumu_user_preferences';

export function usePreferences() {
  const sessionId = useSession();
  const client = useMemo(() => sessionId ? getSessionClient(sessionId) : null, [sessionId]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Load preferences on mount
  useEffect(() => {
    if (!sessionId) return;

    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        // Try to load from Supabase first
        const { data, error } = await client!
          .from('user_preferences')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (error) {
          console.error('Error loading preferences from Supabase:', error);
          // Fall back to localStorage
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localData) {
            const parsed = JSON.parse(localData);
            setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
          }
        } else if (data) {
          setPreferences({
            language: data.language,
            knowledge_level: data.knowledge_level,
            visit_style: data.visit_style,
            pace_preference: data.pace_preference,
            interests: data.interests || [],
            discounts: data.discounts || [],
            show_eligible_discounts_only: data.show_eligible_discounts_only,
            remind_free_days: data.remind_free_days,
            prefer_less_walking: data.prefer_less_walking,
            prefer_elevator: data.prefer_elevator,
            kid_friendly_content: data.kid_friendly_content,
            visit_reminders: data.visit_reminders,
            nickname: (data as any).nickname || '',
            gender: (data as any).gender || '',
            avatar_url: (data as any).avatar_url || '',
            location_country: (data as any).location_country || '',
            location_region: (data as any).location_region || '',
            location_city: (data as any).location_city || '',
          });
          lastSavedRef.current = JSON.stringify(data);
        } else {
          // No data in Supabase, check localStorage
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localData) {
            const parsed = JSON.parse(localData);
            setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
          }
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [sessionId]);

  // Save preferences with debounce
  const savePreferences = useCallback(async (newPrefs: UserPreferences) => {
    if (!sessionId) return;

    const prefsString = JSON.stringify(newPrefs);
    if (prefsString === lastSavedRef.current) return;

    setSaveStatus('saving');

    // Always save to localStorage as backup
    localStorage.setItem(LOCAL_STORAGE_KEY, prefsString);

    try {
      const { error } = await client!
        .from('user_preferences')
        .upsert({
          session_id: sessionId,
          ...newPrefs,
        }, {
          onConflict: 'session_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        setSaveStatus('error');
      } else {
        lastSavedRef.current = prefsString;
        setSaveStatus('saved');
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setSaveStatus('error');
    }
  }, [sessionId]);

  // Debounced update function
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save (300ms debounce)
      saveTimeoutRef.current = setTimeout(() => {
        savePreferences(newPrefs);
      }, 300);
      
      return newPrefs;
    });
  }, [savePreferences]);

  // Retry save
  const retrySave = useCallback(() => {
    savePreferences(preferences);
  }, [savePreferences, preferences]);

  // Reset to defaults
  const resetPreferences = useCallback(async () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    if (sessionId) {
      try {
        await client!
          .from('user_preferences')
          .delete()
          .eq('session_id', sessionId);
      } catch (err) {
        console.error('Error deleting preferences:', err);
      }
    }
    
    lastSavedRef.current = '';
    setSaveStatus('idle');
  }, [sessionId]);

  return {
    preferences,
    updatePreferences,
    saveStatus,
    isLoading,
    retrySave,
    resetPreferences,
  };
}
