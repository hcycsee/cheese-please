export function displayName(user: { name: string; preferredName?: string | null }) {
  return user.preferredName?.trim() || user.name;
}

/** Strips sensitive fields before a user record is sent to the client. */
export function publicUser<T extends { passwordHash?: string }>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}
