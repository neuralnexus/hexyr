import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HexdumpPage } from '../../src/app/features/hexdump/HexdumpPage';
import { WorkspaceProvider } from '../../src/app/hooks/useWorkspace';

afterEach(() => {
  cleanup();
});

describe('HexdumpPage', () => {
  it('decodes explicit input, searches bytes, and exposes selected byte facts', () => {
    render(
      <WorkspaceProvider>
        <HexdumpPage />
      </WorkspaceProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText('Paste hex, text, base64, or binary'), {
      target: { value: '41 42 41' },
    });

    expect(screen.getByRole('button', { name: 'Offset 0, byte 41' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search encoding'), {
      target: { value: 'text' },
    });
    fireEvent.change(screen.getByLabelText('Search bytes'), {
      target: { value: 'A' },
    });
    expect(screen.getByText('2 matches')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Offset 1, byte 42' }));
    expect(screen.getByText('0x1 · 1')).toBeTruthy();
    expect(screen.getByText('01000010')).toBeTruthy();
  });
});
