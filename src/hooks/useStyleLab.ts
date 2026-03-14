import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface Generation {
  id: string;
  preset_key: string;
  source_image_url: string;
  output_image_url: string | null;
  status: string;
  created_at: string;
}

export function useStyleLab() {
  const sessionId = useSession();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WebP image.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be under 10 MB.';
    }
    return null;
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast({ title: 'Invalid file', description: validationError, variant: 'destructive' });
      return null;
    }

    setIsUploading(true);
    setError(null);
    setOutputImageUrl(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `sources/${sessionId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('style-lab')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('style-lab').getPublicUrl(path);
      setSourceImageUrl(data.publicUrl);
      return data.publicUrl;
    } catch (e: any) {
      const msg = 'Failed to upload image. Please try again.';
      setError(msg);
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [sessionId, validateFile, toast]);

  const generate = useCallback(async (presetKey: string) => {
    if (!sourceImageUrl || !sessionId) return;

    setIsGenerating(true);
    setError(null);
    setOutputImageUrl(null);

    try {
      // Create generation record
      const { data: genRow, error: insertErr } = await supabase
        .from('style_lab_generations' as any)
        .insert({
          session_id: sessionId,
          preset_key: presetKey,
          source_image_url: sourceImageUrl,
          status: 'pending',
        } as any)
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      const generationId = (genRow as any).id;
      setCurrentGenerationId(generationId);

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('style-lab-generate', {
        body: { sourceImageUrl, presetKey, generationId, sessionId },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Generation failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.outputImageUrl) {
        setOutputImageUrl(data.outputImageUrl);
      } else {
        throw new Error('No result received');
      }
    } catch (e: any) {
      const msg = e.message || 'Something went wrong. Please try again.';
      setError(msg);
      toast({ title: 'Generation failed', description: msg, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [sourceImageUrl, sessionId, toast]);

  const reset = useCallback(() => {
    setSourceImageUrl(null);
    setOutputImageUrl(null);
    setError(null);
    setCurrentGenerationId(null);
  }, []);

  return {
    isUploading,
    isGenerating,
    sourceImageUrl,
    outputImageUrl,
    error,
    currentGenerationId,
    uploadImage,
    generate,
    reset,
    setSourceImageUrl,
  };
}
