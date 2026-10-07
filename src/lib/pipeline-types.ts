interface ExperienceItem {
  summary: string
  title: string
}

interface ScrapedProfile {
  about: string
  error?: string
  experience: ExperienceItem[]
  headline: string
  name: string
  skills: string[]
  status: "blocked" | "error" | "ok"
  url: string
}

type ProgressEvent =
  | { phase: "started"; query: string }
  | { phase: "google-done"; count: number; urls: string[] }
  | { phase: "awaiting-login" }
  | { phase: "profile"; index: number; profile: ScrapedProfile; total: number }
  | { phase: "done"; profiles: ScrapedProfile[] }
  | { phase: "error"; message: string }

export type { ExperienceItem, ProgressEvent, ScrapedProfile }
