import type { Task, Vendor, Budget, Brief } from '../schemas/plan.js';

/** @fileoverview Deterministic risk engine.
 * Evaluates season/weather, vendor gaps, budget, timeline, guests against venue.
 * Gemini may add up to 3 additional contextual risks (validated separately). */

export type RiskCategory =
  | 'weather' | 'vendor' | 'venue' | 'budget'
  | 'timeline' | 'guest' | 'legal' | 'health' | 'other';

export interface Risk {
  id:         string;
  title:      string;
  reason:     string;
  severity:   1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  category:   RiskCategory;
  source:     'rule' | 'gemini';
  backup: {
    action:        string;
    costRupees:    number | null;
    dueDaysBefore: number;
  };
  backupDone: boolean;
}

// ── Weather table (season/region, month 1-12) ────────────────────────────────

const MONSOON_CITIES = new Set([
  'mumbai','pune','goa','chennai','bangalore','bengaluru','hyderabad',
  'kochi','thiruvananthapuram','kolkata','bhubaneswar',
]);

function getMonsoonRisk(city: string, month: number): Risk | null {
  const lc = city.toLowerCase();
  const isMonsoon = month >= 6 && month <= 9;
  if (!isMonsoon) return null;
  const highRisk = MONSOON_CITIES.has(lc);
  return {
    id: 'weather_monsoon',
    title: 'Monsoon weather disruption',
    reason: `${city} is in active monsoon season in month ${month}. Outdoor venues, decorators and caterers are frequently disrupted.`,
    severity:   highRisk ? 4 : 3,
    likelihood: highRisk ? 4 : 3,
    category: 'weather',
    source: 'rule',
    backup: {
      action: 'Book an air-conditioned indoor backup venue now; include weather clause in all vendor contracts.',
      costRupees: null,
      dueDaysBefore: 60,
    },
    backupDone: false,
  };
}

// ── Festival season vendor shortage ──────────────────────────────────────────

const FESTIVAL_MONTHS = new Set([10, 11, 1, 2]); // Oct, Nov, Jan, Feb

function getFestivalShortageRisk(month: number): Risk | null {
  if (!FESTIVAL_MONTHS.has(month)) return null;
  return {
    id: 'vendor_festival_shortage',
    title: 'Peak-season vendor shortage',
    reason: `Month ${month} is peak wedding/festival season in India. Top caterers, decorators and photographers book 6-9 months ahead.`,
    severity:   3,
    likelihood: 4,
    category: 'vendor',
    source: 'rule',
    backup: {
      action: 'Shortlist and confirm all primary vendors within 2 weeks. Identify one backup per category.',
      costRupees: null,
      dueDaysBefore: 90,
    },
    backupDone: false,
  };
}

// ── Single-vendor dependency ──────────────────────────────────────────────────

function getSingleVendorRisks(vendors: ReadonlyArray<Vendor>): ReadonlyArray<Risk> {
  const byCategory = new Map<string, Vendor[]>();
  for (const v of vendors) {
    const arr = byCategory.get(v.categoryKey) ?? [];
    arr.push(v);
    byCategory.set(v.categoryKey, arr);
  }
  const risks: Risk[] = [];
  for (const [cat, vList] of byCategory) {
    if (vList.length === 1 && vList[0]?.status === 'accepted') {
      risks.push({
        id: `vendor_single_${cat}`,
        title: `Single ${cat} vendor — no backup`,
        reason: `You have accepted only one ${cat} vendor. If they cancel or default, there is no fallback.`,
        severity:   4,
        likelihood: 2,
        category: 'vendor',
        source: 'rule',
        backup: {
          action: `Identify and pre-negotiate with a second ${cat} vendor as a named backup.`,
          costRupees: null,
          dueDaysBefore: 30,
        },
        backupDone: false,
      });
    }
  }
  return risks;
}

// ── Quote without cancellation policy ────────────────────────────────────────

function getCancellationRisks(vendors: ReadonlyArray<Vendor>): ReadonlyArray<Risk> {
  const risks: Risk[] = [];
  for (const v of vendors) {
    const accepted = v.accepted != null ? v.quotes[v.accepted] : null;
    if (accepted && !accepted.cancellationPolicy) {
      risks.push({
        id: `legal_no_cancel_${v.id}`,
        title: `${v.name || v.categoryKey}: no cancellation policy`,
        reason: 'Accepted quote has no cancellation clause. You have no recourse if the vendor cancels.',
        severity:   3,
        likelihood: 2,
        category: 'legal',
        source: 'rule',
        backup: {
          action: 'Request a written cancellation and refund clause before signing. Minimum: 50% refund if cancelled >30 days out.',
          costRupees: null,
          dueDaysBefore: 14,
        },
        backupDone: false,
      });
    }
  }
  return risks;
}

// ── Thin contingency ─────────────────────────────────────────────────────────

function getContingencyRisk(budget: Budget): Risk | null {
  const cont = budget.categories.find(c => c.key === 'contingency');
  if (!cont) return null;
  const pct = (cont.amount / budget.total) * 100;
  if (pct >= 5) return null;
  return {
    id: 'budget_thin_contingency',
    title: `Contingency at ${pct.toFixed(1)}% — below safe minimum`,
    reason: 'Indian weddings and festivals routinely run 10-20% over estimate. A contingency below 5% leaves no buffer.',
    severity:   3,
    likelihood: 4,
    category: 'budget',
    source: 'rule',
    backup: {
      action: 'Trim the lowest-priority non-essential category and move ₹ to contingency until it reaches 5%.',
      costRupees: null,
      dueDaysBefore: 30,
    },
    backupDone: false,
  };
}

// ── Overdue critical tasks ────────────────────────────────────────────────────

function getOverdueRisks(tasks: ReadonlyArray<Task>, _today: string): ReadonlyArray<Risk> {
  const critical = tasks.filter(t => t.essential && t.isOverdue && t.status !== 'done');
  if (critical.length === 0) return [];
  return [{
    id: 'timeline_overdue',
    title: `${critical.length} critical task${critical.length > 1 ? 's' : ''} overdue`,
    reason: `These tasks have missed their due date: ${critical.map(t => t.title).slice(0, 3).join(', ')}${critical.length > 3 ? '…' : ''}.`,
    severity:   4,
    likelihood: 5,
    category: 'timeline',
    source: 'rule',
    backup: {
      action: 'Address overdue tasks immediately — reschedule or delegate. Update their status to unlock the timeline.',
      costRupees: null,
      dueDaysBefore: 0,
    },
    backupDone: false,
  }];
}

// ── Guest vs venue capacity ───────────────────────────────────────────────────

const VENUE_CAPACITY_DEFAULTS: Record<string, number> = {
  wedding: 350, engagement: 150, birthday_kids: 100, birthday_adult: 200,
  baby_shower: 80, coming_of_age: 150, community_festival: 1500,
};

function getCapacityRisk(brief: Brief): Risk | null {
  const cap = VENUE_CAPACITY_DEFAULTS[brief.occasion] ?? 350;
  if (brief.guests <= cap) return null;
  return {
    id: 'venue_capacity',
    title: `${brief.guests} guests may exceed typical ${brief.occasion} venue capacity`,
    reason: `The average ${brief.occasion} venue in ${brief.city} comfortably seats ~${cap} guests. Confirm capacity before signing.`,
    severity:   3,
    likelihood: 3,
    category: 'venue',
    source: 'rule',
    backup: {
      action: 'Get a written confirmed guest capacity from the venue; arrange overflow seating or a second hall.',
      costRupees: null,
      dueDaysBefore: 45,
    },
    backupDone: false,
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

export interface RiskInput {
  brief:   Brief;
  budget:  Budget;
  tasks:   ReadonlyArray<Task>;
  vendors: ReadonlyArray<Vendor>;
  today:   string;  // YYYY-MM-DD
}

/**
 * Runs all deterministic risk rules and returns a deduplicated, sorted list.
 * Sort order: severity × likelihood descending.
 */
export function computeRisks(input: RiskInput): ReadonlyArray<Risk> {
  const { brief, budget, tasks, vendors, today } = input;
  const month = Number(brief.eventDate.split('-')[1]);

  const allRisks: Risk[] = [
    getMonsoonRisk(brief.city, month),
    getFestivalShortageRisk(month),
    ...getSingleVendorRisks(vendors),
    ...getCancellationRisks(vendors),
    getContingencyRisk(budget),
    ...getOverdueRisks(tasks, today),
    getCapacityRisk(brief),
  ].filter((r): r is Risk => r !== null);

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allRisks.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return unique.sort((a, b) => b.severity * b.likelihood - a.severity * a.likelihood);
}
