import { buildXrayQuery, parseKeywords } from "./xray"
import type { ExperienceItem, ProgressEvent, ScrapedProfile } from "./pipeline-types"

const DEFAULT_PROFILES = 5,
  EMPTY_COUNT = 0,
  MAX_PROFILES = 25,
  MIN_PROFILES = 1,
  POSITION_OFFSET = 1,
  RADIX = 10

type RunPhase = "done" | "error" | "idle" | "running"

interface RunRequest {
  limit: number
  must: string
  nice: string
}

interface SourceStatus {
  errorMessage: string
  googleCount: number
  phase: RunPhase
  profiles: ScrapedProfile[]
  statusLine: string
}

interface EventSink {
  setErrorMessage: (value: string) => void
  setGoogleCount: (value: number) => void
  setPhase: (phase: RunPhase) => void
  setProfiles: (update: (previous: ScrapedProfile[]) => ScrapedProfile[]) => void
  setStatusLine: (value: string) => void
}

interface ProgressContext {
  run: RunRequest
  sink: EventSink
  source: EventSource
}

interface SearchSnapshot {
  hasTerms: boolean
  query: string
}

function clampLimit(raw: string): number {
  const parsed = Number.parseInt(raw, RADIX)
  if (Number.isNaN(parsed)) {
    return DEFAULT_PROFILES
  }
  if (parsed < MIN_PROFILES) {
    return MIN_PROFILES
  }
  if (parsed > MAX_PROFILES) {
    return MAX_PROFILES
  }
  return parsed
}

function deriveSearch(mustRaw: string, niceRaw: string): SearchSnapshot {
  const must = parseKeywords(mustRaw)
  const nice = parseKeywords(niceRaw)
  const searchable = must.length > EMPTY_COUNT || nice.length > EMPTY_COUNT
  let query = ""
  if (searchable) {
    query = buildXrayQuery({ must, nice })
  }
  return { hasTerms: searchable, query }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseStringList(raw: unknown): string[] {
  const values: string[] = []
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry === "string") {
        values.push(entry)
      }
    }
  }
  return values
}

function parseExperienceList(raw: unknown): ExperienceItem[] {
  const experience: ExperienceItem[] = []
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (isRecord(entry) && typeof entry.title === "string" && typeof entry.summary === "string") {
        experience.push({ summary: entry.summary, title: entry.title })
      }
    }
  }
  return experience
}

interface ProfileFields {
  about: string
  headline: string
  name: string
  status: ScrapedProfile["status"]
  url: string
}

function parseProfileFields(raw: Record<string, unknown>): ProfileFields | null {
  const { about, headline, name, status, url } = raw
  if (
    typeof about !== "string" ||
    typeof headline !== "string" ||
    typeof name !== "string" ||
    typeof url !== "string"
  ) {
    return null
  }
  if (status !== "ok" && status !== "blocked" && status !== "error") {
    return null
  }
  return { about, headline, name, status, url }
}

function parseScrapedProfile(raw: unknown): ScrapedProfile | null {
  if (!isRecord(raw)) {
    return null
  }
  const fields = parseProfileFields(raw)
  if (fields === null) {
    return null
  }
  const experience = parseExperienceList(raw.experience)
  const skills = parseStringList(raw.skills)
  if (typeof raw.error === "string") {
    return { ...fields, error: raw.error, experience, skills }
  }
  return { ...fields, experience, skills }
}

function parseGoogleDone(raw: Record<string, unknown>): ProgressEvent | null {
  if (typeof raw.count !== "number" || !Array.isArray(raw.urls)) {
    return null
  }
  const urls = parseStringList(raw.urls)
  return { count: raw.count, phase: "google-done", urls }
}

function parseProfileEvent(raw: Record<string, unknown>): ProgressEvent | null {
  if (typeof raw.index !== "number" || typeof raw.total !== "number") {
    return null
  }
  const profile = parseScrapedProfile(raw.profile)
  if (profile === null) {
    return null
  }
  return { index: raw.index, phase: "profile", profile, total: raw.total }
}

function parseDoneEvent(raw: Record<string, unknown>): ProgressEvent {
  const profiles: ScrapedProfile[] = []
  if (Array.isArray(raw.profiles)) {
    for (const entry of raw.profiles) {
      const parsed = parseScrapedProfile(entry)
      if (parsed !== null) {
        profiles.push(parsed)
      }
    }
  }
  return { phase: "done", profiles }
}

function parseSearchPhase(raw: Record<string, unknown>): ProgressEvent | null {
  if (raw.phase === "started" && typeof raw.query === "string") {
    return { phase: "started", query: raw.query }
  }
  if (raw.phase === "google-done") {
    return parseGoogleDone(raw)
  }
  if (raw.phase === "awaiting-login") {
    return { phase: "awaiting-login" }
  }
  return null
}

function parseResultPhase(raw: Record<string, unknown>): ProgressEvent | null {
  if (raw.phase === "profile") {
    return parseProfileEvent(raw)
  }
  if (raw.phase === "done") {
    return parseDoneEvent(raw)
  }
  if (raw.phase === "error" && typeof raw.message === "string") {
    return { message: raw.message, phase: "error" }
  }
  return null
}

function parseProgressEvent(raw: unknown): ProgressEvent | null {
  if (!isRecord(raw)) {
    return null
  }
  const search = parseSearchPhase(raw)
  if (search !== null) {
    return search
  }
  return parseResultPhase(raw)
}

function statusText(status: ScrapedProfile["status"]): string {
  if (status === "blocked") {
    return "Login wall"
  }
  if (status === "error") {
    return "Failed"
  }
  return "Scraped"
}

export {
  DEFAULT_PROFILES,
  EMPTY_COUNT,
  MAX_PROFILES,
  MIN_PROFILES,
  POSITION_OFFSET,
  RADIX,
  clampLimit,
  deriveSearch,
  parseProgressEvent,
  statusText,
  type EventSink,
  type ProgressContext,
  type RunPhase,
  type RunRequest,
  type SearchSnapshot,
  type SourceStatus,
}
