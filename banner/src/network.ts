import { seededGaussian } from "./random.ts";

/** How many neurons each layer has: 5 inputs (languages), two hidden layers, 3 outputs. */
export const LAYER_SIZES = [5, 7, 7, 3];

const WEIGHT_SPREAD = 0.9;
const BIAS_SPREAD = 0.2;

export interface Network {
  /** weights[layer][to][from]: connection strength between neuron `from` and neuron `to`. */
  weights: number[][][];
  /** activations[layer][neuron]: how strongly each neuron fires, from 0 to 1. */
  activations: number[][];
}

/**
 * Runs one forward pass of a small random network. The inputs are my language shares, so the picture
 * is driven by real data; the weights are fixed by `seed` so the shape never jumps around.
 */
export function runForwardPass(inputs: number[], seed: string): Network {
  const gaussian = seededGaussian(seed);
  const activations: number[][] = [inputs];
  const weights: number[][][] = [];

  for (let layer = 0; layer < LAYER_SIZES.length - 1; layer++) {
    const previous = activations[layer]!;
    const layerWeights = Array.from({ length: LAYER_SIZES[layer + 1]! }, () =>
      Array.from({ length: LAYER_SIZES[layer]! }, () => gaussian() * WEIGHT_SPREAD),
    );
    weights.push(layerWeights);

    const next = layerWeights.map((incoming) => {
      const sum = incoming.reduce((total, weight, from) => total + weight * previous[from]!, 0);
      return sigmoid(sum + gaussian() * BIAS_SPREAD);
    });
    activations.push(next);
  }

  return { weights, activations };
}

/** Squashes any number into 0..1, so every neuron carries some signal and none looks "dead". */
function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-2 * value));
}
