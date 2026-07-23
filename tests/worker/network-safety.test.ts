import { describe, expect, it } from 'vitest';
import {
  assertSafeOutboundUrl,
  isPublicIpv4,
  isPublicIpv6,
  normalizeNetworkTarget,
  reverseIpv4,
} from '../../src/worker/utils/networkSafety';

describe('network target safety', () => {
  it('normalizes public URLs and DNS service labels', () => {
    expect(normalizeNetworkTarget('https://Example.COM/path?q=1')).toBe('example.com');
    expect(normalizeNetworkTarget('selector._domainkey.example.com.')).toBe(
      'selector._domainkey.example.com',
    );
  });

  it('blocks local, private, reserved, credentialed, and custom-port targets', () => {
    for (const target of [
      'localhost',
      'api.internal',
      '127.0.0.1',
      '10.2.3.4',
      '169.254.169.254',
      '192.168.1.2',
      'http://user:pass@example.com',
      'https://example.com:8443',
    ]) {
      expect(() => normalizeNetworkTarget(target), target).toThrow();
    }
  });

  it('restricts redirect destinations to standard public HTTP endpoints', () => {
    expect(assertSafeOutboundUrl('https://example.com/path').hostname).toBe('example.com');
    expect(() => assertSafeOutboundUrl('file:///etc/passwd')).toThrow(/http/i);
    expect(() => assertSafeOutboundUrl('http://127.0.0.1/admin')).toThrow(/private|reserved/i);
  });

  it('classifies public IPv4 and builds reverse lookup names', () => {
    expect(isPublicIpv4('8.8.8.8')).toBe(true);
    expect(isPublicIpv4('203.0.113.1')).toBe(false);
    expect(isPublicIpv6('2606:4700:4700::1111')).toBe(true);
    expect(isPublicIpv6('::1')).toBe(false);
    expect(isPublicIpv6('fd00::1')).toBe(false);
    expect(reverseIpv4('8.8.4.4')).toBe('4.4.8.8');
  });
});
