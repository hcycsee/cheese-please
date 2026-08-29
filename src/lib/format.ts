export function displayName(user: { name: string; preferredName?: string | null }) {
  return user.preferredName?.trim() || user.name;
}

/** Strips sensitive fields before a user record is sent to the client. */
export function publicUser<T extends { passwordHash?: string }>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}

const AGE_BANDS = [18, 25, 32, 39, 46, 53, 60];

/** Buckets an exact age into a coarse public range (e.g. "25–31") rather than
 *  exposing the precise number to other users. */
export function ageRangeLabel(age: number | null | undefined): string | null {
  if (age == null) return null;
  if (age < 18) return "Minor";
  for (let i = 0; i < AGE_BANDS.length - 1; i++) {
    if (age >= AGE_BANDS[i] && age < AGE_BANDS[i + 1]) return `${AGE_BANDS[i]}–${AGE_BANDS[i + 1] - 1}`;
  }
  return `${AGE_BANDS[AGE_BANDS.length - 1]}+`;
}

/** The full ordered list of possible ageRangeLabel outputs — used to build the
 *  age-range filter's option list. */
export function ageRangeBuckets(): string[] {
  const buckets = ["Minor"];
  for (let i = 0; i < AGE_BANDS.length - 1; i++) buckets.push(`${AGE_BANDS[i]}–${AGE_BANDS[i + 1] - 1}`);
  buckets.push(`${AGE_BANDS[AGE_BANDS.length - 1]}+`);
  return buckets;
}

/** Applies a user's own chip-visibility preferences before their profile is
 *  sent to someone else — hidden chips are still used for group matching
 *  (that reads the raw fields directly), just not exposed here. */
export function visibleChips(user: {
  gender: string | null;
  age: number | null;
  faculty: string | null;
  mbti: string | null;
  showGender: boolean;
  showAge: boolean;
  showFaculty: boolean;
  showMbti: boolean;
}): { gender: string | null; ageRange: string | null; faculty: string | null; mbti: string | null } {
  return {
    gender: user.showGender ? user.gender : null,
    ageRange: user.showAge ? ageRangeLabel(user.age) : null,
    faculty: user.showFaculty ? user.faculty : null,
    mbti: user.showMbti ? user.mbti : null,
  };
}
