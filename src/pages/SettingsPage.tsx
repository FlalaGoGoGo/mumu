import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Info, Trash2, ExternalLink, User, Phone, Mail, Linkedin, Github } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSavedMuseums } from '@/hooks/useSavedMuseums';
import { usePreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { SaveStatusIndicator } from '@/components/settings/SaveStatusIndicator';
import { MyProfileCard, MyProfileContent } from '@/components/settings/MyProfileCard';
import { ProfileBasicsCard, ProfileBasicsContent } from '@/components/settings/ProfileBasicsCard';
import { InterestsCard, InterestsContent } from '@/components/settings/InterestsCard';
import { DiscountsCard, DiscountsContent } from '@/components/settings/DiscountsCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import mumuLogo from '@/assets/mumu-logo.png';

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const { t, tp } = useLanguage();
  const { preferences, updatePreferences, saveStatus, isLoading, retrySave, resetPreferences } = usePreferences();
  const { clearAll: clearSavedMuseums } = useSavedMuseums();

  const handleClearData = () => {
    // Clear saved museums from localStorage
    clearSavedMuseums();
    // Clear all other localStorage
    localStorage.clear();
    resetPreferences();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] md:h-[calc(100vh-73px)]">
        <div className="animate-pulse text-muted-foreground">{t('settings.loadingPreferences')}</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-73px)]">
      <div className="container max-w-4xl py-6 md:py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t('settings.title')}
          </h1>
        </div>

        {/* My Profile */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold text-foreground">{t('profile.myProfile')}</h2>
            <SaveStatusIndicator status={saveStatus} onRetry={retrySave} />
          </div>

          {isMobile ? (
            <Accordion type="single" collapsible defaultValue="myprofile" className="space-y-3">
              <AccordionItem value="myprofile" className="rounded-lg border border-border/60 bg-card/80 px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-display font-semibold">{t('profile.myProfile')}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <MyProfileContent preferences={preferences} onUpdate={updatePreferences} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <MyProfileCard preferences={preferences} onUpdate={updatePreferences} />
          )}
        </section>

        <Separator className="my-8" />

        {/* A) Personal Preferences */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-5">{t('settings.personalPreferences')}</h2>

          {isMobile ? (
            // Mobile: Accordion Layout
            <Accordion type="single" collapsible defaultValue="profile" className="space-y-3">
              <AccordionItem value="profile" className="rounded-lg border border-border/60 bg-card/80 px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-display font-semibold">{t('settings.profileBasics')}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <ProfileBasicsContent preferences={preferences} onUpdate={updatePreferences} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="interests" className="rounded-lg border border-border/60 bg-card/80 px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-display font-semibold">{t('settings.interests')}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <InterestsContent preferences={preferences} onUpdate={updatePreferences} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="discounts" className="rounded-lg border border-border/60 bg-card/80 px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-display font-semibold">{t('settings.discounts')}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <DiscountsContent preferences={preferences} onUpdate={updatePreferences} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            // Desktop: Grid Layout
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <ProfileBasicsCard preferences={preferences} onUpdate={updatePreferences} />
                <DiscountsCard preferences={preferences} onUpdate={updatePreferences} />
              </div>
              <InterestsCard preferences={preferences} onUpdate={updatePreferences} />
            </div>
          )}
        </section>

        <Separator className="my-8" />

        {/* B) Notifications */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">{t('settings.notifications')}</h2>
          <div className="rounded-lg border border-border/60 bg-card/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="visit-reminders" className="text-base cursor-pointer">
                  {t('settings.visitReminders')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.visitRemindersDescription')}
                </p>
              </div>
              <Switch
                id="visit-reminders"
                checked={preferences.visit_reminders}
                onCheckedChange={(visit_reminders) => updatePreferences({ visit_reminders })}
              />
            </div>
            
            {preferences.remind_free_days && (
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="space-y-0.5">
                  <Label htmlFor="free-day-notify" className="text-base cursor-pointer">
                    {t('settings.freeDayNotifications')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.freeDayNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  id="free-day-notify"
                  checked={preferences.remind_free_days}
                  onCheckedChange={(remind_free_days) => updatePreferences({ remind_free_days })}
                />
              </div>
            )}
          </div>
        </section>

        <Separator className="my-8" />

        {/* C) Data & Privacy */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">{t('settings.dataPrivacy')}</h2>
          <div className="rounded-lg border border-border/60 bg-card/80 p-5 shadow-sm">
            <div>
              <h3 className="font-medium mb-1">{t('settings.yourData')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.dataDescription')}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('settings.clearAllData')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.clearDataTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.clearDataDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
                      {t('settings.clearAllData')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* About */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">{t('settings.about')}</h2>
          <div className="rounded-lg border border-border/60 bg-card/80 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <img 
                src={mumuLogo} 
                alt="MuMu" 
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <div>
                <h3 className="font-display text-lg font-semibold">{t('app.title')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.aboutDescription')}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  <span>{tp('settings.version', { version: '0.1.0' })}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us */}
        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">{t('settings.contactUs')}</h2>
          <div className="rounded-lg border border-border/60 bg-card/80 p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{t('settings.creator')}: <span className="font-medium">Flala</span></span>
              </div>
              <a 
                href="tel:+12067417374" 
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>+1 (206) 741-7374</span>
              </a>
              <a 
                href="mailto:flalaz@uw.edu" 
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>flalaz@uw.edu</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/flala/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
              >
                <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>linkedin.com/in/flala</span>
              </a>
              <a 
                href="https://github.com/FlalaGoGoGo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>github.com/FlalaGoGoGo</span>
              </a>
            </div>
          </div>
        </section>

        {/* Credits */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-4">{t('settings.credits')}</h2>
          <div className="rounded-lg border border-border/60 bg-card/80 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground mb-3">
              {t('settings.creditsDescription')}
            </p>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://api.artic.edu/docs/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('settings.aicApiDocs')}
              </a>
            </Button>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
