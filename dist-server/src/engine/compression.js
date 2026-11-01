import { addDays, toYMD } from './timeline.js';
/**
 * Compresses lead times by a uniform scale factor so that the longest task
 * still fits within the runway. Tasks with leadTimeDays=0 are unchanged.
 * Order is preserved. No task's dueDate is set before today.
 */
export function compressTimeline(input) {
    const { eventDate, today, runway } = input;
    const maxLeadTime = Math.max(...input.tasks.map(t => t.leadTimeDays), 1);
    if (runway >= maxLeadTime) {
        // No compression needed
        return { tasks: input.tasks, scaleFactor: 1, isCompressed: false };
    }
    // Scale factor: compress to fit runway, minimum 0
    const scaleFactor = runway > 0 ? runway / maxLeadTime : 0;
    const tasks = input.tasks.map(t => {
        const scaled = Math.round(t.leadTimeDays * scaleFactor);
        const dueDate = addDays(eventDate, -scaled);
        // Never start before today
        const safeDueDate = dueDate < today ? today : dueDate;
        return { ...t, leadTimeDays: scaled, dueDate: safeDueDate };
    });
    // Re-sort by dueDate after compression
    tasks.sort((a, b) => {
        if (!a.dueDate || !b.dueDate)
            return 0;
        return a.dueDate < b.dueDate ? -1 : 1;
    });
    return { tasks, scaleFactor, isCompressed: true };
}
/**
 * Generates a run sheet: tasks due on the event date, ordered by phase then title.
 */
export function buildRunSheet(tasks, eventDate) {
    return tasks
        .filter(t => t.dueDate === eventDate || t.leadTimeDays === 0)
        .sort((a, b) => a.phase - b.phase || a.title.localeCompare(b.title));
}
/**
 * Exports tasks to RFC 5545 iCalendar format (.ics).
 * Handles line folding (max 75 octets) and escapes , ; \\ \\n.
 */
export function exportToICS(tasks, eventTitle, eventDate) {
    const fold = (line) => {
        const out = [];
        let remaining = line;
        while (remaining.length > 75) {
            out.push(remaining.slice(0, 75));
            remaining = ' ' + remaining.slice(75);
        }
        out.push(remaining);
        return out.join('\r\n');
    };
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@utsavai`;
    const now = toYMD(new Date()).replace(/-/g, '') + 'T000000Z';
    const events = tasks
        .filter(t => t.dueDate)
        .map(t => {
        const dtstart = (t.dueDate ?? eventDate).replace(/-/g, '');
        const dtend = dtstart; // all-day
        return [
            'BEGIN:VEVENT',
            fold(`UID:${uid()}`),
            fold(`DTSTAMP:${now}`),
            fold(`DTSTART;VALUE=DATE:${dtstart}`),
            fold(`DTEND;VALUE=DATE:${dtend}`),
            fold(`SUMMARY:${esc(t.title)}`),
            fold(`DESCRIPTION:${esc(`${eventTitle} – ${t.categoryKey}`)}`),
            'END:VEVENT',
        ].join('\r\n');
    });
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UtsavAI//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        fold(`X-WR-CALNAME:${esc(eventTitle)}`),
        ...events,
        'END:VCALENDAR',
    ].join('\r\n');
}
//# sourceMappingURL=compression.js.map