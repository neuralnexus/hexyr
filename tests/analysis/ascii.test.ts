import { describe, expect, it } from 'vitest';
import { generateAsciiText, imageDataToAscii } from '../../src/shared/analysis';

describe('ascii utilities', () => {
  it('renders block ascii text', () => {
    const out = generateAsciiText('HI', { font: 'block', onChar: '#', offChar: ' ' });
    expect(out).toContain('#####');
    expect(out.split('\n').length).toBe(5);
  });

  it('renders mini ascii text', () => {
    const out = generateAsciiText('ok', { font: 'mini', onChar: '*' });
    expect(out).toContain('*O');
  });

  it('maps image data to ascii ramp', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255,
      255, 255, 255, 255,
    ]);
    const out = imageDataToAscii(data, 2, 1, { charset: ' .#' });
    expect(out.length).toBe(2);
  });
});
