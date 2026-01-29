import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Info, Trash2, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(false);

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-73px)]">
      <div className="container max-w-2xl py-6 md:py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your MuMu experience
          </p>
        </div>

        {/* Preferences */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">Preferences</h2>
          <div className="gallery-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications" className="text-base">
                  Visit Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to visit nearby museums
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </section>

        <Separator className="my-6" />

        {/* About */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">About</h2>
          <div className="gallery-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="font-display text-xl font-bold text-primary-foreground">M</span>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">MuMu (P0)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your personal museum companion. Discover art, plan visits, and track your cultural journey.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  <span>Version 0.1.0 • Demo Release</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">Data & Privacy</h2>
          <div className="gallery-card space-y-4">
            <div>
              <h3 className="font-medium mb-1">Your Data</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your visit history and progress are stored locally and in our database. 
                Clear your data to start fresh.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all your visit history and artwork progress. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      Clear Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        {/* Credits */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-4">Credits</h2>
          <div className="gallery-card">
            <p className="text-sm text-muted-foreground mb-3">
              Artwork images and data provided by The Art Institute of Chicago's public API.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://api.artic.edu/docs/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                AIC API Documentation
              </a>
            </Button>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
