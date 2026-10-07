import { useCallback, useState } from "react"
import { DEFAULT_PROFILES, EMPTY_COUNT, clampLimit, type RunRequest } from "../lib/sourcing"
import { parseKeywords } from "../lib/xray"

interface SourceForm {
  formError: boolean
  handleLimitValue: (value: string) => void
  handleMustValue: (value: string) => void
  handleNiceValue: (value: string) => void
  handleStart: () => void
  limitRaw: string
  mustRaw: string
  niceRaw: string
  run: RunRequest | null
}

function useSourceForm(): SourceForm {
  const [formError, setFormError] = useState(false)
  const [limitRaw, setLimitRaw] = useState(`${DEFAULT_PROFILES}`)
  const [mustRaw, setMustRaw] = useState("")
  const [niceRaw, setNiceRaw] = useState("")
  const [run, setRun] = useState<RunRequest | null>(null)
  const handleLimitValue = useCallback((value: string) => {
    setLimitRaw(value)
  }, [])
  const handleMustValue = useCallback((value: string) => {
    setMustRaw(value)
  }, [])
  const handleNiceValue = useCallback((value: string) => {
    setNiceRaw(value)
  }, [])
  const handleStart = useCallback(() => {
    if (
      parseKeywords(mustRaw).length === EMPTY_COUNT &&
      parseKeywords(niceRaw).length === EMPTY_COUNT
    ) {
      setFormError(true)
      return
    }
    setFormError(false)
    setRun({ limit: clampLimit(limitRaw), must: mustRaw, nice: niceRaw })
  }, [limitRaw, mustRaw, niceRaw])
  return {
    formError,
    handleLimitValue,
    handleMustValue,
    handleNiceValue,
    handleStart,
    limitRaw,
    mustRaw,
    niceRaw,
    run,
  }
}

export { useSourceForm, type SourceForm }
