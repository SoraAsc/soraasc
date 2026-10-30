import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { PROFILE } from "./config.ts";
import { fetchProfileData } from "./github.ts";
import { renderBottomBanner } from "./bottom-banner.ts";
import { renderTopBanner } from "./top-banner.ts";

const OUTPUT_DIR = new URL("../../assets/", import.meta.url);

const data = await fetchProfileData(PROFILE.user, findToken());

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(new URL("banner-top.svg", OUTPUT_DIR), renderTopBanner(data) + "\n");
writeFileSync(new URL("banner-bottom.svg", OUTPUT_DIR), renderBottomBanner(data) + "\n");

const languages = data.topLanguages.map((language) => `${language.name} ${language.percent}%`).join(", ");
console.log(`${languages} | ${data.commitsLast30Days} commits in 30d | ${data.contributionsLast12Weeks} in 12w | ${data.publicRepoCount} repos`);

/** Uses the token from the environment (CI), or falls back to the GitHub CLI when running locally. */
function findToken(): string {
  const fromEnv = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execSync("gh auth token", { encoding: "utf8" }).trim();
  } catch {
    throw new Error("No GitHub token found. Set GITHUB_TOKEN, or log in with `gh auth login`.");
  }
}
