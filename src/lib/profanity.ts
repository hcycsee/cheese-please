import Filter from "bad-words";

const filter = new Filter();

/** True if the text contains profanity that should be blocked (chat messages,
 *  bios, display names, Gartic Phone submissions, etc). */
export function containsProfanity(text: string): boolean {
  if (!text.trim()) return false;
  try {
    return filter.isProfane(text);
  } catch {
    return false;
  }
}
