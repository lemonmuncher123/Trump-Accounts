/// <reference lib="webworker" />

import { simulateCollegeSavings, type CalculatorInput, type SimulationOutput } from '../lib/calculator';

interface WorkerRequest {
  requestId: number;
  input: CalculatorInput;
}

interface WorkerResponse {
  requestId: number;
  result: SimulationOutput;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { requestId, input } = event.data;
  const result = simulateCollegeSavings(input);

  const response: WorkerResponse = {
    requestId,
    result
  };

  self.postMessage(response);
};

export {};
