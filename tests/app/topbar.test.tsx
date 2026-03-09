import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TopBar } from '../../src/app/components/TopBar';

afterEach(() => {
  cleanup();
});

describe('TopBar', () => {
  it('opens docs and github links', () => {
    render(
      <MemoryRouter>
        <TopBar dark onToggleTheme={vi.fn()} onOpenPalette={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Docs').closest('a')?.getAttribute('href')).toBe('https://docs.hexyr.com');
    expect(screen.getByLabelText('Open GitHub repository').getAttribute('href')).toBe(
      'https://github.com/neuralnexus/hexyr',
    );
  });

  it('calls theme toggle callback', () => {
    const onToggleTheme = vi.fn();
    render(
      <MemoryRouter>
        <TopBar dark onToggleTheme={onToggleTheme} onOpenPalette={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByLabelText('Toggle color mode')[0]);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
