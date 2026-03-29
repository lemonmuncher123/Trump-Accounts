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
          isSuccess: medianSavings >= expectedTuition
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

function readMedianEndBalance() {
  return screen.getByText(/Median End Balance/i).nextElementSibling?.textContent ?? '';
}

describe('Calculator React Component', () => {
  it('renders the core elements correctly', () => {
    // Provide mocked realistic params
    render(<Calculator historicalMeanReturn={0.125} historicalVolatility={0.169} dataRangeConfig="1950-2024" />);
    
    expect(screen.getByText(/Future College Savings/i)).toBeInTheDocument();
    expect(screen.getByTestId('annual-input')).toBeInTheDocument();
    expect(screen.getByTestId('match-input')).toBeInTheDocument();
    expect(screen.getByTestId('uni-select')).toBeInTheDocument();
  });

  it('updates calculations when inputs change', () => {
    vi.useFakeTimers();
    render(<Calculator historicalMeanReturn={0.125} historicalVolatility={0.169} dataRangeConfig="1950-2024" />);
    
    const input = screen.getByTestId('annual-input');
    
    fireEvent.change(input, { target: { value: '10000' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(readMedianEndBalance()).toBe('$1,000,000');
  });

  it('keeps only the latest input when values change rapidly', () => {
    vi.useFakeTimers();
    render(<Calculator historicalMeanReturn={0.125} historicalVolatility={0.169} dataRangeConfig="1950-2024" />);

    const input = screen.getByTestId('annual-input');

    fireEvent.change(input, { target: { value: '8000' } });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.change(input, { target: { value: '15000' } });

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(readMedianEndBalance()).toBe('$500,000');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(readMedianEndBalance()).toBe('$1,500,000');
  });
});
