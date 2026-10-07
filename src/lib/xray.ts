const EMPTY_COUNT = 0,
  FIRST_INDEX = 0,
  KEYWORD_SEPARATOR = /[,;\n]+/u,
  LINKEDIN_SITE = "linkedin.com/in",
  SINGLETON_COUNT = 1,
  WHITESPACE_RUN = /\s+/gu

interface XrayInput {
  must: string[]
  nice: string[]
  site?: string
}

function normalize(raw: string): string {
  return raw.trim().replaceAll(WHITESPACE_RUN, " ")
}

function parseKeywords(raw: string): string[] {
  const out: string[] = [],
    seen = new Set<string>()
  for (const chunk of raw.split(KEYWORD_SEPARATOR)) {
    const term = normalize(chunk)
    if (term.length > EMPTY_COUNT && !seen.has(term.toLowerCase())) {
      seen.add(term.toLowerCase())
      out.push(term)
    }
  }
  return out
}

function quote(term: string): string {
  return `"${term.replaceAll('"', "").trim()}"`
}

function buildXrayQuery(input: XrayInput): string {
  const must = input.must.map((term) => term.trim()).filter((term) => term.length > EMPTY_COUNT),
    nice = input.nice.map((term) => term.trim()).filter((term) => term.length > EMPTY_COUNT),
    parts = [`site:${input.site ?? LINKEDIN_SITE}`]
  for (const term of must) {
    parts.push(quote(term))
  }
  if (nice.length === SINGLETON_COUNT) {
    parts.push(quote(nice[FIRST_INDEX]))
  }
  if (nice.length > SINGLETON_COUNT) {
    parts.push(`(${nice.map((term) => quote(term)).join(" OR ")})`)
  }
  return parts.join(" ")
}

function buildGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`
}

export { LINKEDIN_SITE, buildGoogleSearchUrl, buildXrayQuery, parseKeywords, type XrayInput }
