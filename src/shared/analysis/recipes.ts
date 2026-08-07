import { gzip, ungzip } from 'pako';
import {
  base64ToBytes,
  base64ToText,
  binaryToBytes,
  bytesToBase64,
  bytesToText,
  bytesToHex,
  hexToBytes,
  htmlDecode,
  htmlEncode,
  textToBase64,
  textToBytes,
  urlDecode,
  urlEncode,
} from '../encoding';

export const RECIPE_OPERATIONS = [
  'trim',
  'uppercase',
  'lowercase',
  'base64-encode',
  'base64-decode',
  'base64url-encode',
  'hex-encode',
  'hex-decode',
  'binary-encode',
  'binary-decode',
  'url-encode',
  'url-decode',
  'html-encode',
  'html-decode',
  'json-format',
  'json-minify',
  'gzip-base64',
  'gunzip-base64',
] as const;

export type RecipeOperation = (typeof RECIPE_OPERATIONS)[number];

export interface RecipeDefinition {
  version: 1;
  name: string;
  steps: RecipeOperation[];
}

export interface RecipeTrace {
  step: number;
  operation: RecipeOperation;
  inputLength: number;
  outputLength: number;
  output: string;
}

export interface RecipeResult {
  output: string;
  trace: RecipeTrace[];
  error: string | null;
  failedStep: number | null;
}

export const RECIPE_PRESETS: RecipeDefinition[] = [
  {
    version: 1,
    name: 'Decode API payload',
    steps: ['url-decode', 'base64-decode', 'json-format'],
  },
  {
    version: 1,
    name: 'Compact JSON to base64url',
    steps: ['json-minify', 'base64url-encode'],
  },
  {
    version: 1,
    name: 'Hex to readable JSON',
    steps: ['hex-decode', 'json-format'],
  },
  {
    version: 1,
    name: 'Compress JSON for transport',
    steps: ['json-minify', 'gzip-base64'],
  },
  {
    version: 1,
    name: 'Inspect compressed payload',
    steps: ['gunzip-base64', 'json-format'],
  },
];

const MAX_STEPS = 24;
const MAX_OUTPUT_LENGTH = 16 * 1024 * 1024;

export function recipeOperationLabel(operation: RecipeOperation): string {
  return operation
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function applyRecipeOperation(input: string, operation: RecipeOperation): string {
  switch (operation) {
    case 'trim':
      return input.trim();
    case 'uppercase':
      return input.toUpperCase();
    case 'lowercase':
      return input.toLowerCase();
    case 'base64-encode':
      return textToBase64(input);
    case 'base64-decode':
      return base64ToText(input);
    case 'base64url-encode':
      return textToBase64(input, true);
    case 'hex-encode':
      return bytesToHex(textToBytes(input));
    case 'hex-decode': {
      const withoutPrefixes = input.replace(/0x/gi, '');
      if (/[^0-9a-f\s:,_-]/i.test(withoutPrefixes)) {
        throw new Error('Hex input contains non-hex characters.');
      }
      const cleaned = withoutPrefixes.replace(/[\s:,_-]/g, '');
      if (!cleaned || cleaned.length % 2 !== 0) {
        throw new Error('Hex input must contain complete byte pairs.');
      }
      return bytesToText(hexToBytes(cleaned));
    }
    case 'binary-encode':
      return Array.from(textToBytes(input), (byte) => byte.toString(2).padStart(8, '0')).join(' ');
    case 'binary-decode':
      return bytesToText(binaryToBytes(input));
    case 'url-encode':
      return urlEncode(input);
    case 'url-decode':
      return urlDecode(input);
    case 'html-encode':
      return htmlEncode(input);
    case 'html-decode':
      return htmlDecode(input);
    case 'json-format':
      return JSON.stringify(JSON.parse(input) as unknown, null, 2);
    case 'json-minify':
      return JSON.stringify(JSON.parse(input) as unknown);
    case 'gzip-base64':
      return bytesToBase64(gzip(textToBytes(input)));
    case 'gunzip-base64':
      return bytesToText(ungzip(base64ToBytes(input)));
  }
}

export function runRecipe(input: string, steps: RecipeOperation[]): RecipeResult {
  if (steps.length > MAX_STEPS) {
    return {
      output: input,
      trace: [],
      error: `Recipes are limited to ${MAX_STEPS} steps.`,
      failedStep: 0,
    };
  }

  let output = input;
  const trace: RecipeTrace[] = [];
  for (let index = 0; index < steps.length; index += 1) {
    const operation = steps[index];
    const inputLength = output.length;
    try {
      output = applyRecipeOperation(output, operation);
      if (output.length > MAX_OUTPUT_LENGTH) {
        throw new Error('Output exceeded the 16 MiB safety limit.');
      }
      trace.push({
        step: index + 1,
        operation,
        inputLength,
        outputLength: output.length,
        output,
      });
    } catch (error) {
      return {
        output,
        trace,
        error:
          error instanceof Error
            ? `${recipeOperationLabel(operation)}: ${error.message}`
            : `${recipeOperationLabel(operation)} failed.`,
        failedStep: index,
      };
    }
  }
  return { output, trace, error: null, failedStep: null };
}

export function parseRecipeDefinition(input: string): RecipeDefinition {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input) as unknown;
  } catch {
    throw new Error('Recipe JSON is malformed.');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Recipe must be a JSON object.');
  const candidate = parsed as Partial<RecipeDefinition>;
  if (candidate.version !== 1) throw new Error('Unsupported recipe version.');
  if (typeof candidate.name !== 'string' || !candidate.name.trim() || candidate.name.length > 80) {
    throw new Error('Recipe name must contain 1–80 characters.');
  }
  if (!Array.isArray(candidate.steps) || candidate.steps.length > MAX_STEPS) {
    throw new Error(`Recipe steps must be an array with at most ${MAX_STEPS} entries.`);
  }
  const supported = new Set<string>(RECIPE_OPERATIONS);
  if (!candidate.steps.every((step) => typeof step === 'string' && supported.has(step))) {
    throw new Error('Recipe includes an unsupported operation.');
  }
  return {
    version: 1,
    name: candidate.name.trim(),
    steps: [...candidate.steps] as RecipeOperation[],
  };
}

export function serializeRecipeDefinition(recipe: RecipeDefinition): string {
  return JSON.stringify(recipe, null, 2);
}
