import { describe, expect, it } from 'vitest';
import {
  convertStructured,
  formatByKind,
  formatStructured,
  minifyStructured,
  validateByKind,
  validateStructured,
} from '../../src/shared/parsing';

describe('json/yaml formatter', () => {
  it('formats json', () => {
    const out = formatStructured('{"a":1,"b":[2,3]}', 'json');
    expect(out).toContain('\n  "a": 1');
  });

  it('formats yaml', () => {
    const out = formatStructured('name: hexyr\nitems:\n- one\n- two', 'yaml');
    expect(out).toContain('name: hexyr');
  });

  it('minifies yaml to json', () => {
    const out = minifyStructured('a: 1\nb: 2', 'yaml');
    expect(out).toBe('{"a":1,"b":2}');
  });

  it('validates structured input', () => {
    const out = validateStructured('{"ok":true}', 'json');
    expect(out.ok).toBe(true);
  });

  it('formats xml', () => {
    const out = formatByKind('<root><a>1</a></root>', 'xml');
    expect(out).toContain('<root>');
    expect(out).toContain('<a>1</a>');
  });

  it('formats ini/env keys in stable order', () => {
    const out = formatByKind('B=2\nA=1', 'ini');
    expect(out.startsWith('A=1')).toBe(true);
  });

  it('formats sql text', () => {
    const out = formatByKind('select a,b from users where id=1', 'sql');
    expect(out.toLowerCase()).toContain('select');
  });

  it('validates http message structure', () => {
    const out = validateByKind('GET / HTTP/1.1\nHost: hexyr.com\n', 'http');
    expect(out.ok).toBe(true);
  });

  it('converts toml to yaml', () => {
    const out = convertStructured('name = "hexyr"', 'toml', 'yaml');
    expect(out).toContain('name: hexyr');
  });
});
