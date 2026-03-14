import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, Download, RotateCcw, ImageIcon, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStyleLab } from '@/hooks/useStyleLab';
import { STYLE_PRESETS, type StylePreset } from '@/lib/styleLabPresets';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function StyleLabPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isUploading,
    isGenerating,
    sourceImageUrl,
    outputImageUrl,
    error,
    uploadImage,
    generate,
    reset,
  } = useStyleLab();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showBefore, setShowBefore] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    await uploadImage(file);
  }, [uploadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleGenerate = useCallback(() => {
    if (selectedPreset) generate(selectedPreset);
  }, [selectedPreset, generate]);

  const handleDownload = useCallback(async () => {
    if (!outputImageUrl) return;
    try {
      const response = await fetch(outputImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mumu-style-lab-${selectedPreset || 'art'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(outputImageUrl, '_blank');
    }
  }, [outputImageUrl, selectedPreset]);

  const handleRegenerate = useCallback(() => {
    if (selectedPreset) generate(selectedPreset);
  }, [selectedPreset, generate]);

  const handleNewPhoto = useCallback(() => {
    reset();
    setSelectedPreset(null);
    setShowBefore(false);
  }, [reset]);

  const selectedPresetData = STYLE_PRESETS.find(p => p.key === selectedPreset);

  // Step determination
  const step = !sourceImageUrl ? 'upload' : !outputImageUrl && !isGenerating ? 'select' : 'result';

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-3 text-muted-foreground" onClick={() => navigate('/art')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Art
        </Button>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Style Lab</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Transform your photo into a masterpiece inspired by the world's greatest paintings
            </p>
          </div>
        </div>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer",
              dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30",
              isUploading && "pointer-events-none opacity-60"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-foreground">Uploading your photo…</p>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="font-display text-lg font-semibold text-foreground mb-1">
                  Upload your photo
                </p>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Portraits, couples, and family photos work best. Drag and drop or click to browse.
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or WebP · Max 10 MB
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Preview of presets */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">Available Styles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {STYLE_PRESETS.map((preset) => (
                <PresetMiniCard key={preset.key} preset={preset} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Preset Step */}
      {step === 'select' && (
        <div className="space-y-6">
          {/* Source image preview + change */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <img src={sourceImageUrl!} alt="Your photo" className="h-20 w-20 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">Your photo is ready</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose a painting style below</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleNewPhoto}>Change</Button>
          </div>

          {/* Preset grid */}
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-3">Choose a Style</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STYLE_PRESETS.map((preset) => (
                <PresetCard
                  key={preset.key}
                  preset={preset}
                  selected={selectedPreset === preset.key}
                  onClick={() => setSelectedPreset(preset.key)}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Generate button */}
          <div className="sticky bottom-20 md:bottom-4 z-10 flex justify-center">
            <Button
              size="lg"
              className="gap-2 shadow-lg px-8"
              disabled={!selectedPreset}
              onClick={handleGenerate}
            >
              <Sparkles className="h-4 w-4" />
              Generate {selectedPresetData ? `"${selectedPresetData.title}"` : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Result Step (includes generating state) */}
      {(step === 'result' || isGenerating) && (
        <div className="space-y-6">
          {/* Generating state */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="h-32 w-32 rounded-2xl overflow-hidden border border-border">
                  <img src={sourceImageUrl!} alt="Source" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
              <p className="font-display text-lg font-semibold text-foreground mb-1">
                Creating your masterpiece…
              </p>
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                Applying {selectedPresetData?.title || 'artistic'} style. This may take 15–30 seconds.
              </p>
            </div>
          )}

          {/* Result display */}
          {outputImageUrl && !isGenerating && (
            <div className="space-y-6">
              {/* Before / After comparison */}
              <div className="relative rounded-xl border border-border bg-card overflow-hidden">
                {/* Toggle */}
                <div className="flex border-b border-border">
                  <button
                    className={cn(
                      "flex-1 py-2.5 text-sm font-medium transition-colors text-center",
                      !showBefore ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setShowBefore(false)}
                  >
                    After — {selectedPresetData?.title}
                  </button>
                  <button
                    className={cn(
                      "flex-1 py-2.5 text-sm font-medium transition-colors text-center",
                      showBefore ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setShowBefore(true)}
                  >
                    Original Photo
                  </button>
                </div>

                <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-square max-h-[600px] mx-auto">
                  <img
                    src={showBefore ? sourceImageUrl! : outputImageUrl}
                    alt={showBefore ? "Original" : "Stylized"}
                    className="h-full w-full object-contain bg-muted/30"
                  />
                </div>

                {/* Swipe hint on mobile */}
                {isMobile && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-foreground/70 px-3 py-1.5 text-xs text-background">
                    <ChevronLeft className="h-3 w-3" />
                    Tap to compare
                    <ChevronRight className="h-3 w-3" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="gap-2 w-full sm:w-auto" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto" onClick={handleRegenerate}>
                  <RotateCcw className="h-4 w-4" />
                  Regenerate
                </Button>
                <Button variant="ghost" size="lg" className="gap-2 w-full sm:w-auto" onClick={handleNewPhoto}>
                  <ImageIcon className="h-4 w-4" />
                  New Photo
                </Button>
              </div>

              {/* Preset info */}
              {selectedPresetData && (
                <div className="text-center text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedPresetData.title}</span>
                  {' · '}
                  {selectedPresetData.artist}, {selectedPresetData.year}
                </div>
              )}
            </div>
          )}

          {/* Error in result step */}
          {error && !isGenerating && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive max-w-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRegenerate}>Try Again</Button>
                <Button variant="ghost" onClick={handleNewPhoto}>Start Over</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Compact preset card for the upload page preview */
function PresetMiniCard({ preset }: { preset: StylePreset }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center">
      <span className="text-2xl">{preset.thumbnailEmoji}</span>
      <p className="text-xs font-medium text-foreground leading-tight">{preset.title}</p>
    </div>
  );
}

/* Full preset selection card */
function PresetCard({ preset, selected, onClick }: { preset: StylePreset; selected: boolean; onClick: () => void }) {
  return (
    <Card
      className={cn(
        "relative cursor-pointer p-4 transition-all hover:shadow-md",
        selected ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/40"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">{preset.thumbnailEmoji}</span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground text-sm leading-tight">{preset.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{preset.artist}, {preset.year}</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{preset.description}</p>
          <p className="text-xs text-primary/80 mt-1">Best for: {preset.bestFor}</p>
        </div>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </Card>
  );
}
