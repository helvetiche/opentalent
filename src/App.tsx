import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { buildGoogleSearchUrl } from "@/lib/xray"
import { MAX_PROFILES, MIN_PROFILES, deriveSearch } from "@/lib/sourcing"
import { useSourceForm } from "@/hooks/useSourceForm"
import {
  EmptyQuery,
  HeaderSection,
  KeywordField,
  LimitField,
  QueryCard,
} from "@/components/source-form"
import { PipelineView } from "@/components/results"
import { ChromeTabs } from "@/components/chrome-tabs"

function App() {
  const form = useSourceForm()
  const search = deriveSearch(form.mustRaw, form.niceRaw)
  const handleOpenGoogle = useCallback(() => {
    if (search.hasTerms) {
      globalThis.open(buildGoogleSearchUrl(search.query), "_blank", "noopener,noreferrer")
    }
  }, [search])
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <HeaderSection />
      <ChromeTabs />
      <section aria-label="Search keywords" className="flex flex-col gap-4">
        <KeywordField
          id="must"
          label="Must have (all of these)"
          onValue={form.handleMustValue}
          placeholder="python, react, sql"
          value={form.mustRaw}
        />
        <KeywordField
          id="nice"
          label="Nice to have (any of these)"
          onValue={form.handleNiceValue}
          placeholder="aws, docker, typescript"
          value={form.niceRaw}
        />
        <LimitField
          id="limit"
          label="Profiles to open (limit)"
          max={MAX_PROFILES}
          min={MIN_PROFILES}
          onValue={form.handleLimitValue}
          value={form.limitRaw}
        />
        {search.hasTerms && <QueryCard onOpenGoogle={handleOpenGoogle} query={search.query} />}
        {!search.hasTerms && <EmptyQuery submitted={form.formError} />}
        <Button onClick={form.handleStart}>Source candidates</Button>
      </section>
      <PipelineView run={form.run} />
    </main>
  )
}

export default App
