/** Who the banners are for and what they say. Edit here to change the text. */
export const PROFILE = {
  /** GitHub login, also used as the seed that makes the neural network look the same on every run. */
  user: process.env.GH_USER ?? "SoraAsc",
  fullName: "Marcos Vinícios Dias Ferreira",
  tagline: "Rebuilding things to understand them.",
  footerTitle: "Thanks for stopping by.",
};

/** One palette that reads on both white and dark pages: neutral grey plus a single violet accent. */
export const COLORS = {
  accent: "#7c5cf5",
  accentLight: "#b39dff",
  /** Darkest and brightest shades of the accent, used to show how strongly a neuron fires. */
  neuronDim: "#5a45c2",
  neuronBright: "#a28bff",
  grey: "#8b949e",
};

export const FONTS = {
  mono: "'Fira Code','JetBrains Mono',ui-monospace,Menlo,Consolas,monospace",
  sans: "Inter,'Segoe UI',Helvetica,Arial,sans-serif",
};

/** Languages that are tooling noise rather than something I write. */
export const IGNORED_LANGUAGES = new Set([
  "Dockerfile",
  "Makefile",
  "Shell",
  "CMake",
  "Just",
  "Batchfile",
  "ShaderLab",
  "HLSL",
  "Jupyter Notebook",
]);

/** The GitHub API only needs a few repos' worth of languages; this also keeps requests low. */
export const MAX_REPOS_TO_SCAN = 40;
export const TOP_LANGUAGE_COUNT = 5;
export const ACTIVITY_WINDOW_DAYS = 84; // 12 weeks
