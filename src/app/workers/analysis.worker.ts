import { estimateEntropy, getByteFrequency } from '../../shared/analysis';

interface WorkerInput {
  bytes: number[];
}

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const bytes = new Uint8Array(event.data.bytes);
  const payload = {
    entropy: estimateEntropy(bytes),
    frequency: getByteFrequency(bytes).slice(0, 64),
  };
  self.postMessage(payload);
};
