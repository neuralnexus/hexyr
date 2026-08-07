import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DiffPage } from '../../src/app/features/diff/DiffPage';

afterEach(() => {
  cleanup();
});

describe('DiffPage', () => {
  it('renders synchronized changed bytes and selected facts', () => {
    render(<DiffPage />);
    expect(screen.getByText(/First difference at 0x3/)).toBeTruthy();
    const changed = screen.getByRole('button', {
      name: 'left offset 3, byte 6c, changed',
    });
    fireEvent.click(changed);
    expect(screen.getByText('0x3')).toBeTruthy();
    expect(screen.getByText('changed')).toBeTruthy();
  });

  it('reports malformed explicit input instead of silently changing encodings', () => {
    render(<DiffPage />);
    fireEvent.change(screen.getByLabelText('Left payload'), {
      target: { value: 'zz11' },
    });
    expect(screen.getByText(/non-hex characters/i)).toBeTruthy();
  });
});
