export interface RegexExtractResult {
  matches: Array<Record<string, string>>;
  errors: string[];
}

export function extractStructuredWithRegex(input: string, pattern: string, flags = 'gm'): RegexExtractResult {
  const errors: string[] = [];
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (err) {
    return {
      matches: [],
      errors: [err instanceof Error ? err.message : 'Invalid regex'],
    };
  }

  const matches: Array<Record<string, string>> = [];
  for (const match of input.matchAll(regex)) {
    if (!match.groups || Object.keys(match.groups).length === 0) {
      matches.push({ match: match[0] });
      continue;
    }
    matches.push(
      Object.fromEntries(
        Object.entries(match.groups).map(([key, value]) => [key, value ?? '']),
      ),
    );
  }

  if (matches.length === 0) {
    errors.push('No matches found');
  }

  return { matches, errors };
}
