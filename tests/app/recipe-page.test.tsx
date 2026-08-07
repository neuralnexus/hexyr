import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RecipePipelinePage } from '../../src/app/features/recipe/RecipePipelinePage';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('RecipePipelinePage', () => {
  it('runs the visible recipe and exposes intermediate values', () => {
    render(<RecipePipelinePage />);
    expect((screen.getByLabelText('Pipeline output') as HTMLTextAreaElement).value).toBe(
      'eyJoZWxsbyI6IkhleHlyIiwiY291bnQiOjN9',
    );
    fireEvent.click(screen.getByText('Intermediate values'));
    expect(screen.getByText('1. Json Minify')).toBeTruthy();
  });

  it('loads a preset definition without persisting its payload', () => {
    render(<RecipePipelinePage />);
    fireEvent.click(screen.getByText('Hex to readable JSON'));
    expect((screen.getByLabelText('Recipe name') as HTMLInputElement).value).toBe(
      'Hex to readable JSON',
    );
    expect((screen.getByLabelText('Transform step 1') as unknown as HTMLSelectElement).value).toBe(
      'hex-decode',
    );
    expect(localStorage.getItem('hexyr:saved-recipes:v1')).toBeNull();
  });
});
