export function readLocalSetting(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeLocalSetting(key: string, value: string): boolean {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLocalSetting(key: string): boolean {
  try {
    globalThis.localStorage?.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readLocalJson<T>(key: string, fallback: T): T {
  const stored = readLocalSetting(key);
  if (stored === null) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalJson(key: string, value: unknown): boolean {
  return writeLocalSetting(key, JSON.stringify(value));
}
