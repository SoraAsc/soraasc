/** A programming language and how much of my public work it represents. */
export interface Language {
  name: string;
  /** Raw weight: how many repositories' worth of code is written in this language. */
  weight: number;
  /** Share of all my code, rounded to a whole percentage. */
  percent: number;
}

/** Everything the banners need to know about the GitHub account. */
export interface ProfileData {
  user: string;
  publicRepoCount: number;
  /** Most used languages, biggest first. */
  topLanguages: Language[];
  commitsLast30Days: number;
  /** Contributions per day over the last 12 weeks, oldest first. */
  dailyContributions: number[];
  contributionsLast12Weeks: number;
}
