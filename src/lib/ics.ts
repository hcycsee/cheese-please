import ical from "node-ical";
import { DAYS, PERIODS, slotId, type Day } from "./constants";

type BusyBlock = { day: Day; startHour: number; endHour: number };

const MAX_EVENTS = 3000;

function jsWeekdayToDay(jsDay: number): Day {
  // JS Date#getDay(): 0=Sun..6=Sat. Our DAYS starts Monday.
  return DAYS[(jsDay + 6) % 7];
}

function hoursOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  // supports ranges that wrap past midnight (start > end)
  const expand = (s: number, e: number) => (s <= e ? [[s, e]] : [[s, 24], [0, e]]);
  for (const [as, ae] of expand(aStart, aEnd)) {
    for (const [bs, be] of expand(bStart, bEnd)) {
      if (as < be && bs < ae) return true;
    }
  }
  return false;
}

/**
 * Parses raw .ics text and returns a best-effort guess of which of our
 * Day:Period slots the calendar owner is NOT already busy during — i.e.
 * candidate "likely online" slots to pre-fill in the availability step.
 * Best-effort only: malformed events are skipped rather than thrown.
 */
export function suggestFreeSlotsFromIcs(icsText: string): string[] {
  const busy: BusyBlock[] = [];

  let parsed: Record<string, any> = {};
  try {
    parsed = ical.sync.parseICS(icsText);
  } catch {
    return [];
  }

  let count = 0;
  for (const key of Object.keys(parsed)) {
    if (count++ > MAX_EVENTS) break;
    const ev = parsed[key];
    if (!ev || ev.type !== "VEVENT") continue;

    const start: Date | undefined = ev.start instanceof Date ? ev.start : undefined;
    const end: Date | undefined = ev.end instanceof Date ? ev.end : undefined;
    if (!start || !end) continue;

    const durationHours = Math.max(0, Math.min(24, (end.getTime() - start.getTime()) / 3_600_000));
    const startHour = start.getHours() + start.getMinutes() / 60;

    try {
      const byweekday: Array<{ weekday: number } | number> | undefined = ev.rrule?.options?.byweekday;
      if (byweekday && byweekday.length > 0) {
        for (const wd of byweekday) {
          const weekdayNum = typeof wd === "number" ? wd : wd.weekday;
          if (typeof weekdayNum !== "number") continue;
          busy.push({
            day: DAYS[((weekdayNum % 7) + 7) % 7],
            startHour,
            endHour: (startHour + durationHours) % 24,
          });
        }
        continue;
      }
    } catch {
      // fall through to single-occurrence handling
    }

    busy.push({
      day: jsWeekdayToDay(start.getDay()),
      startHour,
      endHour: (startHour + durationHours) % 24,
    });
  }

  const freeSlots: string[] = [];
  for (const day of DAYS) {
    for (const period of PERIODS) {
      const isBusy = busy.some(
        (b) => b.day === day && hoursOverlap(b.startHour, b.endHour, period.startHour, period.endHour)
      );
      if (!isBusy) freeSlots.push(slotId(day, period.key));
    }
  }
  return freeSlots;
}
