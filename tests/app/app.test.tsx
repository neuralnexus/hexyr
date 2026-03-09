import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../../src/app/App';

afterEach(() => {
  cleanup();
});

describe('App shell', () => {
  it('renders footer attribution link', () => {
    render(<App />);
    const link = screen.getByText('Made by Matt Ivan');
    expect(link.getAttribute('href')).toBe('https://mattivan.com');
  });

  it('opens command palette with Ctrl+K', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getAllByRole('dialog', { name: 'Command palette' })[0]).toBeTruthy();
  });

  it('toggles light theme class from theme button', () => {
    render(<App />);
    const button = screen.getAllByLabelText('Toggle color mode')[0];
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
