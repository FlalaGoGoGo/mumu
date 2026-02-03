import { useState, useEffect } from 'react';
import { useArtworksRaw } from '@/hooks/useArtworks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, SkipForward, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CacheResult {
  artwork_id: string;
  source_url: string;
  cached_url: string | null;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

interface CacheSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

export default function AdminCacheImagesPage() {
  const { data: artworks, isLoading: artworksLoading } = useArtworksRaw();
  const [caching, setCaching] = useState(false);
  const [results, setResults] = useState<CacheResult[]>([]);
  const [summary, setSummary] = useState<CacheSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCacheImages = async () => {
    if (!artworks || artworks.length === 0) return;

    setCaching(true);
    setError(null);
    setResults([]);
    setSummary(null);

    try {
      // Filter artworks that have image_url
      const artworksToCache = artworks
        .filter(a => a.image_url && a.image_url.trim())
        .map(a => ({
          artwork_id: a.artwork_id,
          image_url: a.image_url,
        }));

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('cache-artwork-images', {
        body: { artworks: artworksToCache },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setResults(data.results || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCaching(false);
    }
  };

  const generateCsvUpdate = () => {
    if (!results.length) return;

    // Create CSV content with cached URLs
    const successResults = results.filter(r => r.status === 'success' || r.status === 'skipped');
    const csvContent = successResults
      .map(r => `${r.artwork_id},${r.cached_url || ''}`)
      .join('\n');

    const blob = new Blob([`artwork_id,image_cached_url\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cached_urls.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const artworksWithImages = artworks?.filter(a => a.image_url && a.image_url.trim()).length || 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Cache Artwork Images</CardTitle>
          <CardDescription>
            Download and cache artwork images to our storage for reliable serving.
            This prevents hotlink protection and CORS issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {artworksLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading artworks...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <strong>{artworksWithImages}</strong> artworks with source images to cache
                </div>
                <Button onClick={handleCacheImages} disabled={caching || artworksWithImages === 0}>
                  {caching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Caching...
                    </>
                  ) : (
                    'Start Caching'
                  )}
                </Button>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                  Error: {error}
                </div>
              )}

              {summary && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="gap-1">
                      Total: {summary.total}
                    </Badge>
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Success: {summary.success}
                    </Badge>
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Failed: {summary.failed}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <SkipForward className="h-3 w-3" />
                      Skipped: {summary.skipped}
                    </Badge>
                  </div>

                  <Progress 
                    value={(summary.success / summary.total) * 100} 
                    className="h-2"
                  />

                  {summary.success > 0 && (
                    <Button variant="outline" onClick={generateCsvUpdate}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Cached URLs CSV
                    </Button>
                  )}
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Results</h3>
                  <ScrollArea className="h-64 rounded-md border">
                    <div className="space-y-1 p-4">
                      {results.map((result, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          {result.status === 'success' && (
                            <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                          )}
                          {result.status === 'failed' && (
                            <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                          )}
                          {result.status === 'skipped' && (
                            <SkipForward className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="font-mono text-xs">{result.artwork_id}</span>
                          {result.error && (
                            <span className="text-xs text-muted-foreground">
                              ({result.error})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>After caching completes:</p>
          <ol className="list-inside list-decimal space-y-2">
            <li>Download the cached URLs CSV using the button above</li>
            <li>Add an <code className="rounded bg-muted px-1">image_cached_url</code> column to your artworks.csv</li>
            <li>Merge the cached URLs into the artworks.csv file</li>
            <li>Upload the updated artworks.csv</li>
          </ol>
          <p>
            The app will automatically use cached URLs when available, falling back 
            to source URLs if needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
