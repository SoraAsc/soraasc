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

### Private contributions

By default only public contributions are counted. To include private ones:

1. In the profile settings, enable "Include private contributions on my profile". For most cases this is all you need:
   the counts then show up for any viewer, including the default `GITHUB_TOKEN` used by the workflow.
2. After the first workflow run, compare the commit count on the banner with your profile. If it is still lower, create a
   classic personal access token with the `read:user` scope and save it as the repository secret `PROFILE_TOKEN`
   (Settings > Secrets and variables > Actions). The workflow uses it automatically when it exists.
