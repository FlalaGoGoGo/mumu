// Museum Detail 2.0 — Interface Contracts
// Reusable types for any museum detail page, not AIC-specific.

export type SourceKind =
  | "official_live"
  | "official_api"
  | "mumu_static"
  | "mumu_generated";

export interface Citation {
  id: string;
  label: string;
  url: string;
  sourceKind: SourceKind;
  accessedAt?: string | null;
  note?: string | null;
}

export interface MuseumEntrance {
  id: string;
  name: string;
  address: string;
  summary?: string | null;
  recommendedFor?: string | null;
}

export type FacilityKey =
  | "checkroom"
  | "restroom"
  | "family_restroom"
  | "infant_care"
  | "elevator"
  | "wheelchair"
  | "quiet_space"
  | "cafe"
  | "shop";

export interface FacilityTag {
  key: FacilityKey;
  label: string;
}

export interface ArtworkRef {
  id: string;
  title: string;
  artistTitle?: string | null;
  year?: string | null;
  imageUrl?: string | null;
  museumPageUrl?: string | null;
  apiUrl?: string | null;
  isOnView?: boolean | null;
  galleryId?: string | null;
  galleryNumber?: string | null;
  floor?: string | null;
  mustSee?: boolean | null;
  shortDescription?: string | null;
}

export interface ExhibitionRef {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  officialUrl?: string | null;
  shortDescription?: string | null;
  status?: "current" | "upcoming" | "past" | "unknown";
  requiresAddOnTicket?: boolean | null;
}

export type KnowledgeTabKey =
  | "on_view_now"
  | "current_exhibitions"
  | "must_sees"
  | "family"
  | "accessibility"
  | "quiet_spaces"
  | "dining"
  | "shop"
  | "know_before_you_go";

export interface MuseumDetailOverview {
  museumId: string;
  slug: string;
  name: string;
  city: string;
  state?: string | null;
  country: string;
  heroImageUrl?: string | null;
  officialSiteUrl?: string | null;
  visitPageUrl?: string | null;
  summary?: string | null;
  visitSnapshot: {
    openToday: boolean | null;
    statusLabel: string;
    todayHours?: string | null;
    nextOpenLabel?: string | null;
    ticketUrl?: string | null;
    entrances: MuseumEntrance[];
    mustKnow: string[];
  };
  counts: {
    artworkCount?: number | null;
    currentExhibitionCount?: number | null;
    mustSeeCount?: number | null;
  };
  featureFlags: {
    hasRoutePrototype: boolean;
    hasAskMuMu: boolean;
    hasMuseumScopedArtworks: boolean;
    hasDiningGuide: boolean;
    hasAccessibilityGuide: boolean;
  };
  knowledgeTabs: Array<{ key: KnowledgeTabKey; label: string }>;
  citations: Citation[];
  freshness: {
    liveOpsAsOf?: string | null;
    catalogAsOf?: string | null;
    note?: string | null;
  };
}

export interface VisitIntake {
  museumId: string;
  visitDate: string;
  timeBudgetMinutes: number | null;
  groupProfile: "solo" | "adults" | "family" | "mixed";
  withChildren: boolean;
  withStroller: boolean;
  largeBags: boolean;
  needsAccessibility: boolean;
  foodPlan: "none" | "coffee_break" | "light_meal" | "full_meal" | "flexible";
  pace: "slow" | "steady" | "fast";
  interests: string[];
  mustSeeArtworkIds: string[];
  mustSeeExhibitionIds: string[];
  entryEntranceId?: string | null;
  language?: "en" | "zh";
  notes?: string | null;
}

export interface TicketRecommendation {
  museumId: string;
  visitDate: string;
  recommendationLabel: string;
  recommendationSummary: string;
  officialPurchaseUrl: string;
  estimatedBasePrice: number | null;
  estimatedAddOnPrice?: number | null;
  currency: string;
  requiresOfficialCheckout: boolean;
  eligibilitySummary?: string | null;
  notes: string[];
  addOnExhibitions: ExhibitionRef[];
  citations: Citation[];
}

export type RouteStepType =
  | "entrance"
  | "gallery"
  | "exhibition"
  | "artwork"
  | "facility"
  | "meal"
  | "rest"
  | "shop"
  | "exit";

export interface RouteStep {
  stepId: string;
  order: number;
  type: RouteStepType;
  title: string;
  subtitle?: string | null;
  location: {
    label: string;
    floor?: string | null;
    galleryId?: string | null;
    galleryNumber?: string | null;
    zone?: string | null;
  };
  durationMinutes: number;
  walkMinutesFromPrevious: number;
  whyThisStop: string;
  primaryObjects: ArtworkRef[];
  nearbyFacilities: FacilityTag[];
  replanHints: string[];
  citations: Citation[];
}

export interface RoutePlan {
  planId: string;
  museumId: string;
  visitDate: string;
  routeMode: "highlights" | "family" | "accessible" | "full";
  confidence: "prototype" | "production";
  entryEntranceId: string;
  exitSuggestion?: string | null;
  totalDurationMinutes: number;
  summary: string;
  rationale: string[];
  steps: RouteStep[];
  citations: Citation[];
}

export interface AskMuMuMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  quickFollowUps?: Array<{ label: string; question: string }>;
}

// Knowledge tab content models
export interface KnowledgeContent {
  family?: KnowledgeFamilyContent;
  accessibility?: KnowledgeAccessibilityContent;
  dining?: KnowledgeDiningContent;
  quietSpaces?: KnowledgeQuietContent;
  shop?: KnowledgeShopContent;
  knowBeforeYouGo?: KnowledgeVisitorPoliciesContent;
}

export interface KnowledgeFamilyContent {
  items: Array<{ title: string; description: string }>;
  citations: Citation[];
}

export interface KnowledgeAccessibilityContent {
  items: Array<{ title: string; description: string }>;
  citations: Citation[];
}

export interface KnowledgeDiningContent {
  venues: Array<{ name: string; description: string; location?: string }>;
  citations: Citation[];
}

export interface KnowledgeQuietContent {
  tips: string[];
  citations: Citation[];
}

export interface KnowledgeShopContent {
  shops: Array<{ name: string; description: string }>;
  citations: Citation[];
}

export interface KnowledgeVisitorPoliciesContent {
  policies: Array<{ title: string; description: string }>;
  citations: Citation[];
}
