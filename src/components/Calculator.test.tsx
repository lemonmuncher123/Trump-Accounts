import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import type { CalculatorInput } from '../lib/calculator';

vi.mock('../lib/calculator', () => ({
  simulateCollegeSavings: (input: CalculatorInput) => {
    const medianSavings = input.annualContribution * 100 + input.employerMatchAnnual * 50;
    const expectedTuition = input.universityType === 'public' ? 120000 : 260000;

    return {
      scatterPoints: [
        {
          id: 1,
          savingsBalance: medianSavings,
          tuitionCost: expectedTuition,
          isSuccess: medianSavings >= expectedTuition,
          balanceByYear: new Float64Array(input.yearsToMatriculation ?? 18),
        }
      ],
      expectedTuition,
      medianSavings,
      successRate: medianSavings >= expectedTuition ? 100 : 0
    };
  }
}));

import Calculator from './Calculator';

afterEach(() => {
  vi.useRealTimers();
});

function readMedianBalance() {
  // Find the "Median Balance" row (with optional "(gross)" suffix) in the summary panel.
  // Multiple "Median Balance" elements may exist (gross + after-tax); pick the first.
  const allMatches = screen.getAllByText((_content, element) => {
    return element?.tagName === 'SPAN' && /Median Balance/i.test(element.textContent ?? '');
  });
  const container = allMatches[0]?.closest('div');
  return container?.querySelector('strong')?.textContent ?? '';
}

describe('Calculator React Component', () => {
  it('renders the core elements correctly', () => {
    render(<Calculator monthlyMean={0.0099} monthlyVol={0.0488} dataRangeConfig="1950-2024" />);

    expect(screen.getByText(/Future College Savings/i)).toBeInTheDocument();
    expect(screen.getByTestId('annual-input')).toBeInTheDocument();
    expect(screen.getByTestId('match-input')).toBeInTheDocument();
    expect(screen.getByTestId('birth-year-select')).toBeInTheDocument();
  });

  it('updates calculations when inputs change', () => {
    vi.useFakeTimers();
    render(<Calculator monthlyMean={0.0099} monthlyVol={0.0488} dataRangeConfig="1950-2024" />);

    const input = screen.getByTestId('annual-input');

    fireEvent.change(input, { target: { value: '10000' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    // With capped inputs: annualContribution=10000 → cappedAnnual=min(10000, 5000-0)=5000
    // Mock: medianSavings = 5000*100 + 0*50 = 500000
    expect(readMedianBalance()).toBe('$500,000');
  });

  it('keeps only the latest input when values change rapidly', () => {
    vi.useFakeTimers();
    render(<Calculator monthlyMean={0.0099} monthlyVol={0.0488} dataRangeConfig="1950-2024" />);

    const input = screen.getByTestId('annual-input');

    fireEvent.change(input, { target: { value: '8000' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.change(input, { target: { value: '15000' } });

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    // First debounced value: 8000 → capped to 5000 → 500000
    expect(readMedianBalance()).toBe('$500,000');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    // Second debounced value: 15000 → capped to 5000 → 500000 (same due to cap)
    expect(readMedianBalance()).toBe('$500,000');
  });
});
