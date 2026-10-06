type StorageAccess = () => Pick<Storage, "getItem" | "setItem">;

/** Storage may be denied by the browser, or unavailable even on property access. */
export function readStorage(
  access: StorageAccess,
  key: string,
  fallback: string | null = null,
): string | null {
  try {
    return access().getItem(key);
  } catch {
    return fallback;
  }
}

export function writeStorage(
  access: StorageAccess,
  key: string,
  value: string,
) {
  try {
    access().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Session navigation state is a local path, never an external or script URL. */
export function internalBackPath(value: string | null, origin: string) {
  if (!value) return null;
  try {
    const url = new URL(value, origin);
    return url.origin === origin
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}
