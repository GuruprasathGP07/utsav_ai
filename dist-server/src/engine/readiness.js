const SCALE = 0.8;
const BACKUP_DONE_FACTOR = 0.2; // backupDone counts only 20% of penalty
/**
 * Computes penalty for a single risk.
 * If backup is done, only 20% of the penalty applies.
 */
function penalty(risk) {
    const raw = risk.severity * risk.likelihood * SCALE;
    return risk.backupDone ? raw * BACKUP_DONE_FACTOR : raw;
}
/**
 * Computes the readiness score, category breakdown, and top-3 actions
 * ranked by penalty reduction per day (most urgent first).
 */
export function computeReadiness(risks) {
    if (risks.length === 0) {
        return { score: 100, breakdown: {}, topActions: [] };
    }
    const totalPenalty = risks.reduce((s, r) => s + penalty(r), 0);
    const raw = 100 - totalPenalty;
    const score = Math.round(Math.max(0, Math.min(100, raw)));
    // Category breakdown: penalty impact by category
    const breakdown = {};
    for (const r of risks) {
        breakdown[r.category] = Math.round((breakdown[r.category] ?? 0) + penalty(r));
    }
    // Top 3 actions: undone risks ranked by penaltyReduction / dueDaysBefore
    const undone = risks.filter(r => !r.backupDone);
    const ranked = undone
        .map(r => ({
        riskId: r.id,
        title: r.backup.action,
        penaltyReduction: Math.round(penalty(r) - penalty({ ...r, backupDone: true })),
        costRupees: r.backup.costRupees,
        dueDaysBefore: r.backup.dueDaysBefore,
    }))
        .sort((a, b) => {
        // Sort by penalty reduction / max(dueDaysBefore, 1) descending
        const urgencyA = a.penaltyReduction / Math.max(a.dueDaysBefore, 1);
        const urgencyB = b.penaltyReduction / Math.max(b.dueDaysBefore, 1);
        return urgencyB - urgencyA;
    })
        .slice(0, 3);
    return { score, breakdown, topActions: ranked };
}
//# sourceMappingURL=readiness.js.map