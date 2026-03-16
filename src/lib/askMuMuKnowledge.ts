/**
 * Curated knowledge base for Ask MuMu (AIC prototype).
 * Keyword-matched responses with real citations.
 * Future: replaced by RAG pipeline.
 */
import type { AskMuMuMessage, Citation } from '@/types/museumDetail';

interface KnowledgeEntry {
  keywords: string[];
  answer: string;
  citations: Citation[];
  followUps: Array<{ label: string; question: string }>;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ['bag', 'bags', 'luggage', 'suitcase', 'backpack', 'checkroom', 'coat check', 'large bag'],
    answer: `**Bag policy at the Art Institute of Chicago:**\n\nBags and backpacks larger than **13 × 17 × 4 inches** are not allowed in the galleries and must be checked. The checkroom is **free** and available at both the Michigan Avenue and Modern Wing entrances.\n\nSmaller bags and purses are allowed. No food or open drinks in galleries — sealed water bottles are permitted.\n\n💡 *Tip: Arrive a few minutes early so bag check doesn't cut into your gallery time.*`,
    citations: [
      { id: 'visitor-policies', label: 'AIC Visitor Policies', url: 'https://www.artic.edu/visit/visitor-policies', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Which entrance is best?', question: 'Which entrance should I use for my first visit?' },
      { label: 'Is there a coat check?', question: 'Can I check my coat at the museum?' },
    ],
  },
  {
    keywords: ['2 hour', 'two hour', '1 hour', 'one hour', 'best route', 'what to see', 'prioritize', 'highlights', 'short visit', 'limited time'],
    answer: `**Best route for a short visit:**\n\nFor a focused 1–2 hour visit, stay on **Floor 2** and hit these highlights in order:\n\n1. **Gallery 240** — *A Sunday on La Grande Jatte* (Seurat) — the museum's signature work\n2. **Gallery 241** — *Self-Portrait* (Van Gogh) + *The Poet's Garden* — just next door\n3. **Gallery 262** — *Nighthawks* (Hopper) — iconic American painting\n4. **Gallery 201** — Quick Impressionist finish with Monet and Renoir (optional)\n\nThis covers 4 must-see works with minimal walking. Skip Gallery 201 if under 90 minutes.\n\n💡 *Use the "Plan My Visit" tool above to get a personalized route based on your exact time.*`,
    citations: [
      { id: 'floor-plan', label: 'AIC Museum Floor Plan', url: 'https://www.artic.edu/visit/explore-on-your-own/museum-floor-plan', sourceKind: 'official_live', accessedAt: '2026-03-15' },
      { id: 'artwork-27992', label: 'La Grande Jatte', url: 'https://www.artic.edu/artworks/27992', sourceKind: 'official_api', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'What if I have kids?', question: 'Is the museum good for kids? Any family tips?' },
      { label: 'Where should I eat?', question: 'Where can I eat inside the museum?' },
    ],
  },
  {
    keywords: ['kid', 'kids', 'children', 'child', 'family', 'toddler', 'baby', 'stroller'],
    answer: `**Visiting with kids & families:**\n\n✅ **Ryan Learning Center** (Modern Wing) — Free drop-in art activities, no registration needed. Great for ages 3–12.\n\n✅ **Strollers** — Single and double strollers are welcome in most galleries. Oversized strollers must be checked.\n\n✅ **Family restrooms** — Available on multiple floors with changing stations.\n\n✅ **Nursing rooms** — Located near the Family entrance and lower level.\n\n💡 *Tip: Enter via the Modern Wing entrance for quickest access to the Ryan Learning Center. The first hour (10–11 AM) is member-only, so plan accordingly.*`,
    citations: [
      { id: 'visit-main', label: 'AIC Visit', url: 'https://www.artic.edu/visit', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Best route with kids', question: 'What route works best for a family with young children?' },
      { label: 'Stroller policy', question: 'Can I bring my stroller into all galleries?' },
    ],
  },
  {
    keywords: ['famous', 'on view', 'must see', 'iconic', 'best art', 'top works', 'masterpiece'],
    answer: `**Famous works currently on view:**\n\nBased on the latest data, these must-see works are currently on display:\n\n🎨 **A Sunday on La Grande Jatte** — Georges Seurat (Gallery 240, Floor 2)\n🎨 **Self-Portrait** — Vincent van Gogh (Gallery 241, Floor 2)\n🎨 **Nighthawks** — Edward Hopper (Gallery 262, Floor 2)\n🎨 **On the Bank of the Seine** — Claude Monet (Gallery 201, Floor 2)\n\n⚠️ **Not currently on view:** *The Bedroom* by Van Gogh — this is part of the collection but may be on loan or in conservation.\n\n💡 *Gallery availability can change. Check the official site for same-day confirmation.*`,
    citations: [
      { id: 'artwork-27992', label: 'La Grande Jatte', url: 'https://www.artic.edu/artworks/27992', sourceKind: 'official_api', accessedAt: '2026-03-15' },
      { id: 'artwork-111628', label: 'Nighthawks', url: 'https://www.artic.edu/artworks/111628', sourceKind: 'official_api', accessedAt: '2026-03-15' },
      { id: 'artwork-80607', label: 'Van Gogh Self-Portrait', url: 'https://www.artic.edu/artworks/80607', sourceKind: 'official_api', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Best 2-hour route', question: 'What\'s the best route if I only have 2 hours?' },
      { label: 'Tell me about Nighthawks', question: 'Tell me the story behind Nighthawks by Edward Hopper' },
    ],
  },
  {
    keywords: ['nighthawks', 'hopper', 'edward hopper'],
    answer: `**Nighthawks** by Edward Hopper (1942)\n*Gallery 262, Floor 2*\n\nOne of the most recognized paintings in American art. It depicts four figures in a brightly lit downtown diner late at night. Hopper said the painting was inspired by "a restaurant on Greenwich Avenue where two streets meet," though the exact location has never been confirmed.\n\nThe painting captures a mood of urban isolation — the figures don't interact, and there's no visible door to the diner. The stark fluorescent light against the dark street creates a cinematic quality that has influenced film, photography, and pop culture for decades.\n\n🎨 Oil on canvas, 33.1 × 60 in.\n📍 On view in Gallery 262, Floor 2`,
    citations: [
      { id: 'artwork-111628', label: 'AIC: Nighthawks', url: 'https://www.artic.edu/artworks/111628', sourceKind: 'official_api', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'More about Van Gogh', question: 'Tell me about Van Gogh\'s Self-Portrait at the AIC' },
      { label: 'Where is Gallery 262?', question: 'How do I get to Gallery 262 from the main entrance?' },
    ],
  },
  {
    keywords: ['van gogh', 'self-portrait', 'self portrait', 'vincent'],
    answer: `**Self-Portrait** by Vincent van Gogh (1887)\n*Gallery 241, Floor 2*\n\nPainted during Van Gogh's time in Paris, this self-portrait shows the artist experimenting with the Pointillist technique he encountered through Seurat and Signac. The short, distinct brushstrokes in the background contrast with the more blended treatment of his face.\n\nVan Gogh created over 30 self-portraits during his career — they served as practice when he couldn't afford models. This one reflects his transitional period as he absorbed Impressionist and Post-Impressionist ideas before moving to Arles.\n\n🎨 Oil on artist's board, mounted on cradled panel\n📍 On view in Gallery 241, Floor 2`,
    citations: [
      { id: 'artwork-80607', label: 'AIC: Van Gogh Self-Portrait', url: 'https://www.artic.edu/artworks/80607', sourceKind: 'official_api', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Is The Bedroom on view?', question: 'Is Van Gogh\'s The Bedroom currently on display?' },
      { label: 'Tell me about La Grande Jatte', question: 'Tell me the story behind A Sunday on La Grande Jatte' },
    ],
  },
  {
    keywords: ['grande jatte', 'seurat', 'sunday', 'pointillis'],
    answer: `**A Sunday on La Grande Jatte — 1884** by Georges Seurat (1884–86)\n*Gallery 240, Floor 2*\n\nThis monumental painting (nearly 7 × 10 feet) took Seurat two years to complete. He applied tiny dots of pure color side by side — a technique he called "Chromoluminarism" (later known as Pointillism) — so that colors blend optically in the viewer's eye.\n\nThe scene depicts Parisians relaxing on the island of La Grande Jatte in the Seine. Despite the leisure setting, the figures appear strangely formal and frozen, almost like Egyptian friezes. Seurat made over 60 preparatory studies for this work.\n\nIt's one of the most iconic paintings in the AIC and an essential first stop.\n\n🎨 Oil on canvas, 81.75 × 121.25 in.\n📍 On view in Gallery 240, Floor 2`,
    citations: [
      { id: 'artwork-27992', label: 'AIC: La Grande Jatte', url: 'https://www.artic.edu/artworks/27992', sourceKind: 'official_api', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Best route for 2 hours', question: 'What\'s the best route if I only have 2 hours?' },
      { label: 'Tell me about Nighthawks', question: 'Tell me the story behind Nighthawks by Edward Hopper' },
    ],
  },
  {
    keywords: ['entrance', 'which entrance', 'where to enter', 'door', 'arrive'],
    answer: `**Entrances at the Art Institute:**\n\n🚪 **Michigan Avenue Entrance** (111 S Michigan Ave)\n- Main lobby, clearest first-time arrival path\n- Checkroom, restrooms, and info desk immediately available\n- Best for: first-time visitors, starting with European galleries\n\n🚪 **Modern Wing Entrance** (159 E Monroe St)\n- Direct access to modern/contemporary galleries\n- Closest to the Ryan Learning Center (families)\n- Best for: modern art focus, families with kids\n\nBoth entrances are fully wheelchair accessible. Free wheelchairs available on a first-come basis.`,
    citations: [
      { id: 'visit-main', label: 'AIC Visit', url: 'https://www.artic.edu/visit', sourceKind: 'official_live', accessedAt: '2026-03-15' },
      { id: 'accessibility', label: 'AIC Accessibility', url: 'https://www.artic.edu/visit/accessibility', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Bag check details', question: 'What should I do with my bags?' },
      { label: 'Accessibility info', question: 'What accessibility support is available?' },
    ],
  },
  {
    keywords: ['accessible', 'accessibility', 'wheelchair', 'disability', 'stairs', 'elevator', 'mobility'],
    answer: `**Accessibility at the Art Institute:**\n\n♿ **Wheelchairs** — Free wheelchairs at both entrances (first-come, first-served)\n🛗 **Elevators** — Available in main building and Modern Wing for all floors\n🐕 **Service animals** — Welcome throughout the museum\n🚪 **Entrances** — Both Michigan Ave and Modern Wing are fully accessible\n👂 **Assistive listening** — Available for tours and programs\n\nThe highlights route on Floor 2 is fully elevator-accessible. Use the "Plan My Visit" tool with Accessibility selected for a route optimized for accessible paths.\n\n💡 *The Modern Wing entrance may be slightly easier for wheelchair users as it has a more level approach.*`,
    citations: [
      { id: 'accessibility', label: 'AIC Accessibility', url: 'https://www.artic.edu/visit/accessibility', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Which entrance is best?', question: 'Which entrance should I use for my first visit?' },
      { label: 'Best accessible route', question: 'What\'s the best route if I need to avoid stairs?' },
    ],
  },
  {
    keywords: ['eat', 'food', 'restaurant', 'dining', 'lunch', 'cafe', 'coffee', 'drink', 'hungry'],
    answer: `**Dining options inside the museum:**\n\n🍝 **Terzo Piano** (Modern Wing, 3rd Floor)\n- Full-service Italian-inspired restaurant\n- Great for a sit-down meal (plan 45–60 min)\n\n🥪 **Café Moderno** (Modern Wing, Lower Level)\n- Counter-service with sandwiches, salads, pastries\n- Good for a quick 15–20 min break\n\n🍷 **Modern Bar** (Modern Wing, 2nd Floor)\n- Wine, beer, and light snacks with gallery views\n- Good for a brief coffee/drink stop\n\n⚠️ No outside food or open drinks in galleries. Sealed water bottles are OK.`,
    citations: [
      { id: 'dining-shopping', label: 'AIC Dining and Shopping', url: 'https://www.artic.edu/visit/dining-and-shopping', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Bag policy', question: 'What should I do with my bags?' },
      { label: 'Plan my visit', question: 'What\'s the best route for 2 hours?' },
    ],
  },
  {
    keywords: ['ticket', 'price', 'cost', 'admission', 'free', 'discount', 'member'],
    answer: `**Tickets & admission info:**\n\n🎟️ General admission includes the museum and all non-ticketed exhibitions. Some special exhibitions (like Matisse's Jazz) may require an additional ticket.\n\n⏰ **Member-only hour:** 10–11 AM daily is reserved for members.\n\n💡 Check the "Buy Smart" section above for personalized ticket guidance based on your eligibility and planned exhibitions.\n\nMuMu does not sell tickets — we'll link you to the official purchase page.`,
    citations: [
      { id: 'visit-main', label: 'AIC Visit', url: 'https://www.artic.edu/visit', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Any free days?', question: 'Are there free admission days at the Art Institute?' },
      { label: 'What exhibitions need extra tickets?', question: 'Which current exhibitions require a separate ticket?' },
    ],
  },
  {
    keywords: ['photography', 'photo', 'camera', 'selfie', 'picture'],
    answer: `**Photography policy:**\n\n📸 Non-flash photography for **personal use** is generally permitted throughout the museum.\n\n❌ No tripods, selfie sticks, or flash photography.\n❌ No commercial photography without permission.\n\n💡 *Some temporary exhibitions may have additional photography restrictions — look for posted signs.*`,
    citations: [
      { id: 'visitor-policies', label: 'AIC Visitor Policies', url: 'https://www.artic.edu/visit/visitor-policies', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    followUps: [
      { label: 'Bag policy', question: 'What should I do with my bags?' },
      { label: 'Famous works on view', question: 'Which famous works are currently on view?' },
    ],
  },
];

export function findAnswer(question: string): AskMuMuMessage {
  const q = question.toLowerCase();

  for (const entry of KNOWLEDGE_BASE) {
    const matched = entry.keywords.some(kw => q.includes(kw));
    if (matched) {
      return {
        role: 'assistant',
        content: entry.answer,
        citations: entry.citations,
        quickFollowUps: entry.followUps,
      };
    }
  }

  // Honest scope-limited fallback
  return {
    role: 'assistant',
    content: `I can help with specific questions about visiting the Art Institute of Chicago — try asking about:\n\n• **Bags & checkroom** policy\n• **Best route** for your time\n• **Family & kids** tips\n• **Famous works** on view\n• **Accessibility** support\n• **Dining** options\n• **Tickets & admission**\n• **Artwork stories** (Nighthawks, La Grande Jatte, Van Gogh)\n\nI'm currently in prototype mode with curated answers for these topics. For other questions, check the [official AIC website](https://www.artic.edu/visit).`,
    citations: [
      { id: 'visit-main', label: 'AIC Visit', url: 'https://www.artic.edu/visit', sourceKind: 'official_live', accessedAt: '2026-03-15' },
    ],
    quickFollowUps: [
      { label: 'Bag policy', question: 'What should I do with my bags?' },
      { label: 'Best 2-hour route', question: 'What\'s the best route if I only have 2 hours?' },
      { label: 'Famous works on view', question: 'Which famous works are currently on view?' },
    ],
  };
}
