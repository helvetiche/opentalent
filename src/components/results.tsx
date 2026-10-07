import { useEffect, useState } from "react"
import {
  EMPTY_COUNT,
  parseProgressEvent,
  statusText,
  type EventSink,
  type RunPhase,
  type RunRequest,
} from "../lib/sourcing"
import { applyProgressEvent } from "../lib/pipeline-events"
import type { ScrapedProfile } from "../lib/pipeline-types"

function ProfileRow({ profile }: { profile: ScrapedProfile }) {
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 text-sm font-medium">{profile.name || "Unnamed profile"}</td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {profile.headline || "No headline"}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {profile.skills.join(", ") || "None listed"}
      </td>
      <td className="px-3 py-2 text-sm">{statusText(profile.status)}</td>
      <td className="px-3 py-2 text-sm">
        <a
          className="underline underline-offset-4"
          href={profile.url}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
      </td>
    </tr>
  )
}

function ResultsHead() {
  return (
    <thead>
      <tr>
        <th className="px-3 py-2 text-left text-sm font-medium">Name</th>
        <th className="px-3 py-2 text-left text-sm font-medium">Headline</th>
        <th className="px-3 py-2 text-left text-sm font-medium">Skills</th>
        <th className="px-3 py-2 text-left text-sm font-medium">Status</th>
        <th className="px-3 py-2 text-left text-sm font-medium">Profile</th>
      </tr>
    </thead>
  )
}

function ResultsBody({ profiles }: { profiles: ScrapedProfile[] }) {
  return (
    <tbody>
      {profiles.map((profile) => (
        <ProfileRow key={profile.url} profile={profile} />
      ))}
    </tbody>
  )
}

function ResultsTable({ profiles }: { profiles: ScrapedProfile[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse bg-card">
        <caption className="px-3 py-2 text-left text-sm text-muted-foreground">
          Scraped LinkedIn profiles
        </caption>
        <ResultsHead />
        <ResultsBody profiles={profiles} />
      </table>
    </div>
  )
}

interface ProgressPanelProps {
  errorMessage: string
  googleCount: number
  phase: RunPhase
  profiles: ScrapedProfile[]
  statusLine: string
}

function ProgressPanel({
  errorMessage,
  googleCount,
  phase,
  profiles,
  statusLine,
}: ProgressPanelProps) {
  if (phase === "idle") {
    return null
  }
  return (
    <section aria-label="Sourcing progress" className="flex flex-col gap-3">
      <output className="text-sm text-muted-foreground">{statusLine}</output>
      {googleCount > EMPTY_COUNT && phase === "running" && (
        <p className="text-sm text-muted-foreground">Checked {googleCount} Google results</p>
      )}
      {profiles.length > EMPTY_COUNT && phase === "running" && (
        <ul className="flex flex-col gap-1">
          {profiles.map((profile) => (
            <li key={profile.url} className="text-sm">
              {profile.name || profile.url} ({statusText(profile.status)})
            </li>
          ))}
        </ul>
      )}
      {phase === "done" && profiles.length > EMPTY_COUNT && <ResultsTable profiles={profiles} />}
      {phase === "done" && profiles.length === EMPTY_COUNT && (
        <p className="text-sm text-muted-foreground">
          No profiles came back. Try different keywords or a higher limit.
        </p>
      )}
      {phase === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </section>
  )
}

function PipelineView({ run }: { run: RunRequest | null }) {
  const [errorMessage, setErrorMessage] = useState("")
  const [googleCount, setGoogleCount] = useState(EMPTY_COUNT)
  const [phase, setPhase] = useState<RunPhase>("idle")
  const [profiles, setProfiles] = useState<ScrapedProfile[]>([])
  const [statusLine, setStatusLine] = useState("")
  useEffect(() => {
    if (run === null) {
      return
    }
    const source = new EventSource(
      `/api/source?must=${encodeURIComponent(run.must)}&nice=${encodeURIComponent(run.nice)}&limit=${run.limit}`,
    )
    const sink: EventSink = {
      setErrorMessage,
      setGoogleCount,
      setPhase,
      setProfiles,
      setStatusLine,
    }
    source.addEventListener("message", (event: MessageEvent) => {
      const incoming = parseProgressEvent(JSON.parse(event.data))
      if (incoming === null) {
        return
      }
      applyProgressEvent(incoming, { run, sink, source })
    })
    source.addEventListener("error", () => {
      setErrorMessage("Lost connection to the pipeline server. Start it with npm run server.")
      setPhase("error")
      source.close()
    })
    return () => source.close()
  }, [run])
  return (
    <ProgressPanel
      errorMessage={errorMessage}
      googleCount={googleCount}
      phase={phase}
      profiles={profiles}
      statusLine={statusLine}
    />
  )
}

export { PipelineView }
