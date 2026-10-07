import { useCallback, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"

const COPY_FEEDBACK_MS = 1500,
  inputClass =
    "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"

function copyWithTextarea(text: string): boolean {
  const area = document.createElement("textarea")
  area.value = text
  document.body.append(area)
  area.select()
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    area.remove()
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return copyWithTextarea(text)
  }
}

function flagCopied(setter: (value: boolean) => void): void {
  setter(true)
  globalThis.setTimeout(() => setter(false), COPY_FEEDBACK_MS)
}

function useCopyHandler(text: string, setFlag: (value: boolean) => void): () => void {
  return useCallback(async () => {
    try {
      if (await copyText(text)) {
        flagCopied(setFlag)
      }
    } catch {
      // Clipboard unavailable, leave the button unchanged
    }
  }, [text, setFlag])
}

function HeaderSection() {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Source candidates</h1>
      <p className="text-sm text-muted-foreground">
        Enter skills and a limit below. Source searches Google for LinkedIn profiles, opens each
        one, and scrapes the profile data.
      </p>
    </section>
  )
}

interface KeywordFieldProps {
  id: string
  label: string
  onValue: (value: string) => void
  placeholder: string
  value: string
}

function KeywordField({ id, label, onValue, placeholder, value }: KeywordFieldProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onValue(event.target.value)
    },
    [onValue],
  )
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={handleChange}
        className={inputClass}
      />
    </div>
  )
}

interface LimitFieldProps {
  id: string
  label: string
  max: number
  min: number
  onValue: (value: string) => void
  value: string
}

function LimitField({ id, label, max, min, onValue, value }: LimitFieldProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onValue(event.target.value)
    },
    [onValue],
  )
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
        className={inputClass}
      />
    </div>
  )
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCopyHandler(text, setCopied)
  let copyLabel = label
  if (copied) {
    copyLabel = "Copied"
  }
  return (
    <Button variant="outline" onClick={handleCopy}>
      {copyLabel}
    </Button>
  )
}

interface QueryCardProps {
  onOpenGoogle: () => void
  query: string
}

function QueryCard({ onOpenGoogle, query }: QueryCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <code className="font-mono text-sm break-all text-card-foreground">{query}</code>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onOpenGoogle}>
          Open in Google
        </Button>
        <CopyButton label="Copy query" text={query} />
      </div>
    </div>
  )
}

function EmptyQuery({ submitted }: { submitted: boolean }) {
  let message = "Enter at least one skill to preview the x-ray query."
  if (submitted) {
    message = "Add at least one skill above, then press Source."
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export { EmptyQuery, HeaderSection, KeywordField, LimitField, QueryCard }
