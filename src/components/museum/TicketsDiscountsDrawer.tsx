 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { ExternalLink, Ticket, Info, BadgePercent } from 'lucide-react';
 import { usePreferences } from '@/hooks/usePreferences';
 import type { MuseumConfig } from '@/config/museumConfig';
 
 interface TicketsDiscountsDrawerProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   config: MuseumConfig;
 }
 
 // Map discount codes to display labels and hints
 const DISCOUNT_HINTS: Record<string, { label: string; hint: string }> = {
   student: { label: 'Student', hint: 'Student pricing may apply (bring valid student ID).' },
   military: { label: 'Military', hint: 'Military discounts available for active duty and veterans.' },
   icom: { label: 'ICOM Member', hint: 'ICOM members may receive free or discounted entry.' },
   bankOfAmerica: { label: 'Bank of America', hint: 'Free admission on first full weekend of each month (Museums on Us).' },
   museumsForAll: { label: 'Museums for All', hint: 'EBT cardholders receive $3 admission for up to 4 people.' },
   senior: { label: 'Senior', hint: 'Senior pricing ($34) applies for ages 65+.' },
 };
 
 export function TicketsDiscountsDrawer({
   open,
   onOpenChange,
   config,
 }: TicketsDiscountsDrawerProps) {
   const { preferences } = usePreferences();
   
   // Get user's eligible discounts
   const userDiscounts = preferences.discounts || [];
   
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="right" className="w-full sm:max-w-md">
         <SheetHeader>
           <SheetTitle className="font-display text-xl">Tickets & Discounts</SheetTitle>
         </SheetHeader>
 
         <div className="mt-6 space-y-6">
           {/* Buy Tickets CTA */}
           <Button
             className="w-full h-12 text-base"
             asChild
           >
             <a href={config.ticketsUrl} target="_blank" rel="noopener noreferrer">
               <Ticket className="w-5 h-5 mr-2" />
               Buy Tickets
               <ExternalLink className="w-4 h-4 ml-auto" />
             </a>
           </Button>
 
           {/* Admission Prices */}
           <div>
             <h3 className="font-display font-semibold mb-3">Admission Prices</h3>
             <div className="space-y-2">
               {config.admission.map((item) => (
                 <div
                   key={item.category}
                   className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                 >
                   <span className="text-sm">{item.category}</span>
                   <span className="font-medium">{item.price}</span>
                 </div>
               ))}
             </div>
           </div>
 
           {/* Free Admission Callout */}
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
             <div className="flex gap-3">
              <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
               <div>
                <h4 className="font-medium text-foreground mb-1">Free Admission</h4>
                <p className="text-sm text-muted-foreground">{config.freeAdmissionNote}</p>
               </div>
             </div>
           </div>
 
           {/* Member Note */}
           <div className="p-3 bg-muted/50 rounded-md">
             <p className="text-xs text-muted-foreground">{config.memberNote}</p>
           </div>
 
           {/* User's Possible Discounts */}
           {userDiscounts.length > 0 && (
             <div>
               <div className="flex items-center gap-2 mb-3">
                 <BadgePercent className="w-4 h-4 text-accent" />
                 <h3 className="font-display font-semibold">Your Possible Discounts</h3>
               </div>
               <div className="space-y-2">
                 {userDiscounts.map((discountCode) => {
                   const discountInfo = DISCOUNT_HINTS[discountCode];
                   if (!discountInfo) return null;
                   
                   return (
                     <div
                       key={discountCode}
                       className="p-3 bg-accent/5 border border-accent/20 rounded-md"
                     >
                       <div className="flex items-center gap-2 mb-1">
                         <span className="font-medium text-sm">{discountInfo.label}</span>
                       </div>
                       <p className="text-xs text-muted-foreground">{discountInfo.hint}</p>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
 
           {/* No Discounts Hint */}
           {userDiscounts.length === 0 && (
             <div className="p-4 bg-muted/30 rounded-lg text-center">
               <p className="text-sm text-muted-foreground">
                 Set up your discount eligibility in Settings to see personalized savings.
               </p>
             </div>
           )}
         </div>
       </SheetContent>
     </Sheet>
   );
 }