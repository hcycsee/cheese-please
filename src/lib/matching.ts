import type { User } from "@prisma/client";

export const GROUP_TARGET_SIZE = 12;
/** A group is considered a good match once members share at least this many attributes with the seed requester. */
export const GOOD_MATCH_THRESHOLD = 3;

export type Requester = Pick<
  User,
  "id" | "gender" | "age" | "faculty" | "mbti" | "sameGenderOnly" | "ageFactor" | "facultyFactor" | "mbtiFactor"
>;
export type Candidate = Pick<User, "id" | "gender" | "age" | "faculty" | "mbti">;

/** How many of {gender, age, faculty, mbti} this candidate has in common with the requester,
 *  counting a dimension only when the requester has opted into caring about it (gender always counts). */
export function scoreAttributes(requester: Requester, candidate: Candidate): number {
  let score = 0;
  if (requester.gender && candidate.gender && requester.gender === candidate.gender) score += 1;
  if (requester.ageFactor && requester.age != null && candidate.age != null && Math.abs(requester.age - candidate.age) <= 2) {
    score += 1;
  }
  if (requester.facultyFactor && requester.faculty && candidate.faculty && requester.faculty === candidate.faculty) {
    score += 1;
  }
  if (requester.mbtiFactor && requester.mbti && candidate.mbti && requester.mbti === candidate.mbti) {
    score += 1;
  }
  return score;
}

export function passesGenderFilter(requester: Requester, candidate: Candidate): boolean {
  if (!requester.sameGenderOnly) return true;
  return !!requester.gender && !!candidate.gender && requester.gender === candidate.gender;
}

export function pickGroupMembers<C extends Candidate>(
  requester: Requester,
  candidates: C[],
  targetSize: number = GROUP_TARGET_SIZE,
  /** Optional tie-break bonus (e.g. "this candidate usually marks this exact time slot as free") —
   *  used only for sort order, not reflected in the returned attribute score. */
  sortBonus: (candidate: C) => number = () => 0
): Array<{ user: C; score: number }> {
  const eligible = candidates.filter((c) => c.id !== requester.id && passesGenderFilter(requester, c));

  const scored = eligible
    .map((user) => ({ user, score: scoreAttributes(requester, user), sortKey: scoreAttributes(requester, user) + sortBonus(user) }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ user, score }) => ({ user, score }));

  return scored.slice(0, Math.max(0, targetSize - 1));
}

export function summarizeSharedAttributes(requester: Requester, members: Array<{ score: number }>): string {
  const factors: string[] = ["Gender"];
  if (requester.ageFactor) factors.push("Age");
  if (requester.facultyFactor) factors.push("Faculty");
  if (requester.mbtiFactor) factors.push("MBTI");

  const avgScore = members.length ? members.reduce((sum, m) => sum + m.score, 0) / members.length : 0;
  const quality = avgScore >= GOOD_MATCH_THRESHOLD ? "Strong match" : avgScore >= 2 ? "Decent match" : "Loose match";

  return `${quality} — grouped by: ${factors.join(", ")}`;
}
