# Banner generator

Generates `assets/banner-top.svg` and `assets/banner-bottom.svg` for the profile README.

- The top banner draws a small neural network. Its inputs are my most used languages and its pulses speed up with my recent commits.
- The bottom banner draws a wave of my contributions over the last 12 weeks.

The data comes from the GitHub API. Everything is plain TypeScript with no runtime dependencies, run directly by Node 24 (which strips the types itself).

## Layout

| File | What it does |
|---|---|
| `src/config.ts` | Name, tagline, colors, fonts and tuning constants. Start here to change how the banners look or read. |
| `src/github.ts` | Talks to the GitHub API and returns a `ProfileData`. |
| `src/network.ts` | One forward pass of a small random network, seeded so the shape stays stable. |
| `src/top-banner.ts` | Draws the top banner. |
| `src/bottom-banner.ts` | Draws the bottom banner. |
| `src/generate.ts` | Entry point: fetch the data, write the SVG files. |

## Run it

```sh
pnpm install     # only needed for type checking
pnpm banner      # regenerate the SVGs (uses `gh auth token` when no token is set)
pnpm typecheck
```

## Automation

`.github/workflows/banner.yml` runs the generator every Monday and commits the SVGs if they changed.
GitHub pauses scheduled workflows in public repositories after 60 days without repository activity. If that happens,
the Actions tab shows a notice: open the workflow and click "Enable workflow".

### PROFILE_TOKEN (optional, for private contributions)

The default `GITHUB_TOKEN` cannot see private contributions, so the commit count can come out lower than the real one.

1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic), with the `read:user` scope.
2. In this repository: Settings > Secrets and variables > Actions > New repository secret, named `PROFILE_TOKEN`.
3. In the profile settings, enable "Include private contributions on my profile".
