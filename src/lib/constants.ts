export const FACULTIES = [
  "Arts & Humanities",
  "Business & Commerce",
  "Engineering",
  "Science",
  "Medicine & Health",
  "Law",
  "IT & Computer Science",
  "Education",
  "Architecture & Design",
  "Social Sciences",
  "Other",
] as const;

export const GENDERS = [
  "Woman",
  "Man",
  "Non-binary",
  "Prefer not to say",
  "Other",
] as const;

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

export const PERIODS = [
  { key: "Morning", label: "Morning", hours: "6am – 12pm", startHour: 6, endHour: 12 },
  { key: "Afternoon", label: "Afternoon", hours: "12pm – 6pm", startHour: 12, endHour: 18 },
  { key: "Evening", label: "Evening", hours: "6pm – 10pm", startHour: 18, endHour: 22 },
  { key: "Night", label: "Night", hours: "10pm – 6am", startHour: 22, endHour: 6 },
] as const;
export type PeriodKey = (typeof PERIODS)[number]["key"];

export function slotId(day: string, period: string) {
  return `${day}:${period}`;
}

export function getCurrentDayPeriod(date: Date = new Date()): { day: Day; period: PeriodKey; slot: string } {
  const day = DAYS[(date.getDay() + 6) % 7]; // JS: Sun=0 -> shift so Mon=0
  const hour = date.getHours();
  const period = PERIODS.find((p) =>
    p.startHour < p.endHour
      ? hour >= p.startHour && hour < p.endHour
      : hour >= p.startHour || hour < p.endHour
  )!;
  return { day, period: period.key, slot: slotId(day, period.key) };
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
