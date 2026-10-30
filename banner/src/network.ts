import { seededGaussian } from "./random.ts";

/** How many neurons each layer has: 5 inputs (languages), two hidden layers, 3 outputs. */
export const LAYER_SIZES = [5, 7, 7, 3];

const WEIGHT_SPREAD = 0.9;
const BIAS_SPREAD = 0.2;

/** A connection worth drawing: it leaves `from` in `layer` and arrives at `to` in the next layer. */
export interface Connection {
  layer: number;
  from: number;
  to: number;
  /** How much signal flows through it, from 0 to 1. */
  signal: number;
}

export interface Network {
  /** activations[layer][neuron]: how strongly each neuron fires, from 0 to 1. */
  activations: number[][];
  /** The strongest connections only, so every neuron sits on a path from an input to an output. */
  connections: Connection[];
}

/** Each receiving neuron keeps this many of its strongest incoming connections. */
const INCOMING_PER_NEURON = 3;

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

  return { activations, connections: pickConnections(weights, activations) };
}

/** Squashes any number into 0..1, so every neuron carries some signal and none looks "dead". */
function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-2 * value));
}

/**
 * Drawing all connections would bury the picture in faint lines that seem to lead nowhere. Instead:
 * every neuron keeps its strongest incoming connections, and every neuron keeps at least its
 * strongest outgoing one, so nothing is a dead end.
 */
function pickConnections(weights: number[][][], activations: number[][]): Connection[] {
  const kept = new Map<string, Connection>();
  const keep = (connection: Connection) =>
    kept.set(`${connection.layer}:${connection.from}:${connection.to}`, connection);
  const strongestFirst = (a: Connection, b: Connection) => b.signal - a.signal;

  weights.forEach((layerWeights, layer) => {
    const all: Connection[] = layerWeights.flatMap((incoming, to) =>
      incoming.map((weight, from) => ({
        layer,
        from,
        to,
        signal: Math.min(1, Math.abs(weight) * activations[layer]![from]!),
      })),
    );

    const receivers = new Set(all.map((connection) => connection.to));
    for (const to of receivers) {
      all.filter((c) => c.to === to).sort(strongestFirst).slice(0, INCOMING_PER_NEURON).forEach(keep);
    }

    const senders = new Set(all.map((connection) => connection.from));
    for (const from of senders) {
      keep(all.filter((c) => c.from === from).sort(strongestFirst)[0]!);
    }
  });

  return [...kept.values()];
}
