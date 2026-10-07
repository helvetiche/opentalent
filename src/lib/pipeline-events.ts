import { POSITION_OFFSET, type EventSink, type ProgressContext } from "./sourcing"
import type { ProgressEvent } from "./pipeline-types"

type SearchPhaseEvent = Extract<
  ProgressEvent,
  { phase: "started" | "google-done" | "awaiting-login" }
>

type ResultPhaseEvent = Extract<ProgressEvent, { phase: "profile" | "done" }>

function applySearchPhaseEvent(incoming: SearchPhaseEvent, limit: number, sink: EventSink): void {
  if (incoming.phase === "started") {
    sink.setPhase("running")
    sink.setStatusLine(`Searching Google for ${incoming.query}`)
    sink.setProfiles(() => [])
    return
  }
  if (incoming.phase === "google-done") {
    sink.setGoogleCount(incoming.count)
    sink.setStatusLine(
      `Found ${incoming.count} profiles, opening ${Math.min(incoming.count, limit)}`,
    )
    return
  }
  sink.setStatusLine("Log in to LinkedIn in the opened browser window")
}

function applyResultPhaseEvent(
  incoming: ResultPhaseEvent,
  sink: EventSink,
  source: EventSource,
): void {
  if (incoming.phase === "profile") {
    sink.setProfiles((previous) => [...previous, incoming.profile])
    sink.setStatusLine(`Scraping ${incoming.index + POSITION_OFFSET} of ${incoming.total}`)
    return
  }
  sink.setProfiles(() => incoming.profiles)
  sink.setPhase("done")
  sink.setStatusLine(`Done, scraped ${incoming.profiles.length} profiles`)
  source.close()
}

function applyProgressEvent(incoming: ProgressEvent, context: ProgressContext): void {
  const { run, sink, source } = context
  if (
    incoming.phase === "started" ||
    incoming.phase === "google-done" ||
    incoming.phase === "awaiting-login"
  ) {
    applySearchPhaseEvent(incoming, run.limit, sink)
    return
  }
  if (incoming.phase === "profile" || incoming.phase === "done") {
    applyResultPhaseEvent(incoming, sink, source)
    return
  }
  sink.setErrorMessage(incoming.message)
  sink.setPhase("error")
  source.close()
}

export { applyProgressEvent }
