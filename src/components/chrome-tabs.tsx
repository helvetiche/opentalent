import { useCallback, useEffect, useState, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"

interface ChromeTab {
  id: string
  title: string
  url: string
}

const EMPTY_COUNT = 0

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"

function TabOption({ tab }: { tab: ChromeTab }) {
  return <option value={tab.id}>{tab.title || tab.url}</option>
}

function ActiveTabLink({ tab }: { tab: ChromeTab }) {
  return (
    <p className="truncate text-sm text-muted-foreground">
      <a className="underline underline-offset-4" href={tab.url} target="_blank" rel="noreferrer">
        {tab.url}
      </a>
    </p>
  )
}

interface TabSelectProps {
  onSelect: (value: string) => void
  selectedId: string
  tabs: ChromeTab[]
}

function TabSelect({ onSelect, selectedId, tabs }: TabSelectProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onSelect(event.target.value)
    },
    [onSelect],
  )
  return (
    <label htmlFor="chrome-tab-select" className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Open tab</span>
      <select
        id="chrome-tab-select"
        className={selectClass}
        value={selectedId}
        onChange={handleChange}
      >
        <option value="">Select a tab…</option>
        {tabs.map((tab) => (
          <TabOption key={tab.id} tab={tab} />
        ))}
      </select>
    </label>
  )
}

function ChromeTabs() {
  const [tabs, setTabs] = useState<ChromeTab[] | null>(null)
  const [selectedId, setSelectedId] = useState("")
  const [error, setError] = useState("")
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/tabs")
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { tabs: ChromeTab[] }
      setTabs(data.tabs)
      setError("")
    } catch {
      setTabs(null)
      setError("Automation browser is off. Run npm run chrome:debug, then refresh.")
    }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- fetch-on-mount: syncing with the /api/tabs endpoint, the effect's purpose
    void refresh()
  }, [refresh])
  let heading = "Browser tabs"
  if (tabs !== null) {
    heading = `Browser tabs (${tabs.length})`
  }
  const active = tabs?.find((tab) => tab.id === selectedId) ?? null
  return (
    <section aria-label="Browser tabs" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{heading}</h2>
        <Button variant="outline" onClick={refresh}>
          Refresh tabs
        </Button>
      </div>
      {error !== "" && <p className="text-sm text-muted-foreground">{error}</p>}
      {tabs !== null && tabs.length === EMPTY_COUNT && (
        <p className="text-sm text-muted-foreground">Chrome is connected but no tabs are open.</p>
      )}
      {tabs !== null && tabs.length > EMPTY_COUNT && (
        <TabSelect onSelect={setSelectedId} selectedId={selectedId} tabs={tabs} />
      )}
      {active !== null && <ActiveTabLink tab={active} />}
    </section>
  )
}

export { ChromeTabs }
