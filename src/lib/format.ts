export function displayName(user: { name: string; preferredName?: string | null }) {
  return user.preferredName?.trim() || user.name;
}

/** Strips sensitive fields before a user record is sent to the client. */
export function publicUser<T extends { passwordHash?: string }>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}

/** Buckets an exact age into a coarse public range (e.g. "25–31") rather than
 *  exposing the precise number to other users. */
export function ageRangeLabel(age: number | null | undefined): string | null {
  if (age == null) return null;
  if (age < 18) return "Minor";
  const bands = [18, 25, 32, 39, 46, 53, 60];
  for (let i = 0; i < bands.length - 1; i++) {
    if (age >= bands[i] && age < bands[i + 1]) return `${bands[i]}–${bands[i + 1] - 1}`;
  }
  return `${bands[bands.length - 1]}+`;
}
