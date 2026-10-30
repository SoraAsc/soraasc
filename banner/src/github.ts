import {
  ACTIVITY_WINDOW_DAYS,
  IGNORED_LANGUAGES,
  MAX_REPOS_TO_SCAN,
  TOP_LANGUAGE_COUNT,
} from "./config.ts";
import type { Language, ProfileData } from "./types.ts";

const API = "https://api.github.com";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface Repo {
  name: string;
  fork: boolean;
  private: boolean;
}

interface ContributionsResponse {
  data: {
    user: {
      recentCommits: { totalCommitContributions: number };
      calendar: {
        contributionCalendar: {
          weeks: { contributionDays: { contributionCount: number; date: string }[] }[];
        };
      };
    };
  };
}

/** Reads the GitHub API: REST for repositories and languages, GraphQL for contributions. */
export async function fetchProfileData(user: string, token: string): Promise<ProfileData> {
  const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "profile-banner",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`${url} responded with ${response.status}`);
    return (await response.json()) as T;
  };

  const repos = await listOwnPublicRepos(user, request);
  const topLanguages = await findTopLanguages(user, repos, request);
  const activity = await fetchActivity(user, request);

  return {
    user,
    publicRepoCount: repos.length,
    topLanguages,
    commitsLast30Days: activity.commitsLast30Days,
    dailyContributions: activity.dailyContributions,
    contributionsLast12Weeks: activity.dailyContributions.reduce((sum, count) => sum + count, 0),
  };
}

type Request = <T>(url: string, init?: RequestInit) => Promise<T>;

async function listOwnPublicRepos(user: string, request: Request): Promise<Repo[]> {
  const repos = await request<Repo[]>(`${API}/users/${user}/repos?per_page=100&type=owner&sort=pushed`);
  return repos.filter((repo) => !repo.fork && !repo.private).slice(0, MAX_REPOS_TO_SCAN);
}

/**
 * Ranks languages by how many repositories they fill. Each repository counts once and is split
 * between its languages, so a single huge repository cannot dominate the ranking.
 */
async function findTopLanguages(user: string, repos: Repo[], request: Request): Promise<Language[]> {
  const bytesPerRepo = await Promise.all(
    repos.map((repo) =>
      request<Record<string, number>>(`${API}/repos/${user}/${repo.name}/languages`).catch(() => ({})),
    ),
  );

  const weights = new Map<string, number>();
  for (const bytesByLanguage of bytesPerRepo) {
    const languages = Object.entries(bytesByLanguage).filter(([name]) => !IGNORED_LANGUAGES.has(name));
    const totalBytes = languages.reduce((sum, [, bytes]) => sum + bytes, 0);
    for (const [name, bytes] of languages) {
      weights.set(name, (weights.get(name) ?? 0) + bytes / totalBytes);
    }
  }

  const totalWeight = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
  return [...weights.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_LANGUAGE_COUNT)
    .map(([name, weight]) => ({ name, weight, percent: Math.round((100 * weight) / totalWeight) }));
}

/** Commits in the last 30 days and the per-day contribution counts for the last 12 weeks. */
async function fetchActivity(user: string, request: Request) {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * MS_PER_DAY);
  const isoTimestamp = (date: Date) => date.toISOString().replace(/\.\d+Z$/, "Z");
  const isoDay = (date: Date) => date.toISOString().slice(0, 10);

  const windowStart = daysAgo(ACTIVITY_WINDOW_DAYS - 1);
  const query = `{
    user(login: "${user}") {
      recentCommits: contributionsCollection(from: "${isoTimestamp(daysAgo(30))}") { totalCommitContributions }
      calendar: contributionsCollection(from: "${isoTimestamp(windowStart)}") {
        contributionCalendar { weeks { contributionDays { contributionCount date } } }
      }
    }
  }`;

  const response = await request<ContributionsResponse | { errors: { message: string }[] }>(`${API}/graphql`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  // GraphQL answers 200 even on failure, so check for errors explicitly. Failing here is deliberate:
  // it is better for the workflow to go red than to commit a banner full of zeros.
  if ("errors" in response) throw new Error(`GraphQL error: ${response.errors.map((e) => e.message).join("; ")}`);
  const { data } = response;

  // GitHub returns a full year starting at `from`, so keep only the days up to today.
  const dailyContributions = data.user.calendar.contributionCalendar.weeks
    .flatMap((week) => week.contributionDays)
    .filter((day) => day.date >= isoDay(windowStart) && day.date <= isoDay(now))
    .map((day) => day.contributionCount);
  return { commitsLast30Days: data.user.recentCommits.totalCommitContributions, dailyContributions };
}
