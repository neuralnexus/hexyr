export type KnownFormat =
  | 'hex'
  | 'base64'
  | 'base64url'
  | 'binary'
  | 'jwt'
  | 'json'
  | 'urlencoded'
  | 'text'
  | 'unknown';

export interface FormatCandidate {
  format: KnownFormat;
  confidence: number;
  reason: string;
}

export interface AnalysisStats {
  byteCount: number;
  charCount: number;
  bitLength: number;
  lineCount: number;
}

export interface JwtInspection {
  headerRaw: string;
  payloadRaw: string;
  signatureRaw: string;
  headerJson: Record<string, unknown> | null;
  payloadJson: Record<string, unknown> | null;
  warnings: string[];
}

export interface MagicByteMatch {
  name: string;
  mime: string;
  extension: string;
  description: string;
}

export interface ByteFrequencyBucket {
  value: number;
  count: number;
}
