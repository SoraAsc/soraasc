/**
 * Returns a function that yields normally distributed random numbers (mean 0, deviation 1).
 * The same seed always gives the same sequence, so the network keeps its shape between runs
 * and the banner only changes when the GitHub data does.
 */
export function seededGaussian(seed: string): () => number {
  let state = hashString(seed);

  const nextUniform = (): number => {
    // mulberry32: a tiny, well-behaved PRNG.
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Box-Muller turns two uniform numbers into one gaussian one.
  return () => {
    const u1 = nextUniform() || 1e-9;
    const u2 = nextUniform();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

function hashString(text: string): number {
  let hash = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}
