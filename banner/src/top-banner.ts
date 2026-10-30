import { COLORS, PROFILE } from "./config.ts";
import { type Connection, LAYER_SIZES, runForwardPass } from "./network.ts";
import { fadeMask, fmt, MONO, mixColors, SANS, svgOpen } from "./svg.ts";
import type { ProfileData } from "./types.ts";

const WIDTH = 1000;
const HEIGHT = 320;
const CENTER_Y = HEIGHT / 2;

/** Horizontal position of each neuron layer, left to right. */
const LAYER_X = [610, 725, 840, 940];
const NEURON_SPACING = 34;

/** A connection counts as "strong" (drawn brighter, with a travelling pulse) above this signal. */
const STRONG_SIGNAL = 0.5;
const PULSE_LENGTH = 135;

type Point = [x: number, y: number];

/** The wide banner at the top of the README: my name on the left, a neural network fed by my languages on the right. */
export function renderTopBanner(data: ProfileData): string {
  const inputs = data.topLanguages.map((language) => language.weight / data.topLanguages[0]!.weight);
  while (inputs.length < LAYER_SIZES[0]!) inputs.push(0);

  const network = runForwardPass(inputs, data.user);
  const positions = layoutNeurons();
  // The more I commit, the faster the pulses travel.
  const pulseSeconds = Math.max(1.6, 4.4 - data.commitsLast30Days / 25);

  return [
    svgOpen(WIDTH, HEIGHT, data.user),
    definitions(),
    `<ellipse cx="780" cy="${CENTER_Y}" rx="280" ry="${CENTER_Y}" fill="url(#glow)"/>`,
    `<g mask="url(#fade-mask)">`,
    ...drawConnections(network.connections, positions, pulseSeconds),
    ...drawNeurons(network.activations, positions),
    `</g>`,
    ...drawLanguageLabels(data, positions),
    ...drawIntroText(),
    ...drawStatChips(data),
    `</svg>`,
  ].join("\n");
}

function layoutNeurons(): Point[][] {
  return LAYER_SIZES.map((size, layer) =>
    Array.from({ length: size }, (_, index): Point => {
      const top = CENTER_Y + 4 - (NEURON_SPACING * (size - 1)) / 2;
      return [LAYER_X[layer]!, top + index * NEURON_SPACING];
    }),
  );
}

function definitions(): string {
  return `<defs>
<radialGradient id="glow"><stop offset="0" stop-color="${COLORS.accent}" stop-opacity="0.12"/><stop offset="1" stop-color="${COLORS.accent}" stop-opacity="0"/></radialGradient>
<linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.1" stop-color="#fff"/><stop offset="1" stop-color="#fff"/></linearGradient>
${fadeMask("fade-mask", "fade", WIDTH, HEIGHT, { x: 480, width: 520 })}
</defs>`;
}

/** One line per connection; its thickness and brightness show how much signal flows through it. */
function drawConnections(connections: Connection[], positions: Point[][], pulseSeconds: number): string[] {
  const shapes: string[] = [];
  let strongCount = 0;

  for (const { layer, from, to, signal } of connections) {
    const [x1, y1] = positions[layer]![from]!;
    const [x2, y2] = positions[layer + 1]![to]!;
    const line = `x1="${x1}" y1="${fmt(y1)}" x2="${x2}" y2="${fmt(y2)}"`;

    shapes.push(
      `<line ${line} stroke="${COLORS.accent}" stroke-width="${(1 + signal * 1.5).toFixed(2)}" opacity="${(0.35 + signal * 0.6).toFixed(2)}"/>`,
    );

    if (signal > STRONG_SIGNAL) {
      strongCount++;
      const delay = ((strongCount % 8) * 0.35).toFixed(2);
      shapes.push(
        `<line ${line} stroke="${COLORS.accentLight}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="5 130" pathLength="${PULSE_LENGTH}">` +
          `<animate attributeName="stroke-dashoffset" from="${PULSE_LENGTH}" to="0" dur="${pulseSeconds.toFixed(2)}s" begin="${delay}s" repeatCount="indefinite"/></line>`,
      );
    }
  }
  return shapes;
}

/** Each neuron is a solid dot (no transparency, so lines never show through) whose size and shade follow how strongly it fires. */
function drawNeurons(activations: number[][], positions: Point[][]): string[] {
  return positions.flatMap((layer, layerIndex) =>
    layer.map(([x, y], neuron) => {
      const activation = activations[layerIndex]![neuron]!;
      const fill = mixColors(COLORS.neuronDim, COLORS.neuronBright, activation);
      return `<circle cx="${x}" cy="${fmt(y)}" r="${(5 + activation * 4).toFixed(1)}" fill="${fill}" stroke="${COLORS.accent}" stroke-width="1.8"/>`;
    }),
  );
}

function drawLanguageLabels(data: ProfileData, positions: Point[][]): string[] {
  const inputLayer = positions[0]!;
  const labels = data.topLanguages.map((language, index) => {
    const [x, y] = inputLayer[index]!;
    return `<text x="${x - 20}" y="${fmt(y + 4)}" ${MONO} font-size="12" text-anchor="end" fill="${COLORS.grey}">${language.name}  <tspan fill="${COLORS.accent}">${language.percent}%</tspan></text>`;
  });

  const [firstX, firstY] = inputLayer[0]!;
  const caption = `<text x="${firstX - 20}" y="${fmt(firstY - 28)}" ${MONO} font-size="9.5" letter-spacing="1.8" text-anchor="end" fill="${COLORS.grey}" opacity="0.8">TOP LANGUAGES</text>`;
  return [...labels, caption];
}

function drawIntroText(): string[] {
  return [
    `<text x="12" y="${CENTER_Y + 6}" ${SANS} font-size="82" font-weight="800" letter-spacing="-2.5"><tspan fill="${COLORS.accent}">Sora</tspan><tspan fill="${COLORS.grey}">Asc</tspan></text>`,
    `<text x="16" y="${CENTER_Y + 44}" ${MONO} font-size="15" fill="${COLORS.grey}">${PROFILE.fullName}</text>`,
    `<text x="16" y="${CENTER_Y + 68}" ${MONO} font-size="13" fill="${COLORS.grey}" opacity="0.85">${PROFILE.tagline}</text>`,
  ];
}

/** Small outlined pills with a few live numbers. */
function drawStatChips(data: ProfileData): string[] {
  const stats = [
    `${data.publicRepoCount} public repos`,
    `${data.commitsLast30Days} commits / 30d`,
    `top: ${data.topLanguages[0]?.name ?? "n/a"}`,
  ];
  const shapes: string[] = [];
  let x = 16;

  for (const text of stats) {
    const width = 18 + text.length * 7.2; // monospace: width grows with the number of characters
    shapes.push(
      `<rect x="${x}" y="${HEIGHT - 40}" width="${fmt(width)}" height="22" rx="11" fill="none" stroke="${COLORS.grey}" stroke-opacity="0.45"/>`,
      `<text x="${fmt(x + width / 2)}" y="${HEIGHT - 25}" ${MONO} font-size="10.5" text-anchor="middle" fill="${COLORS.grey}">${text}</text>`,
    );
    x += width + 8;
  }
  return shapes;
}
