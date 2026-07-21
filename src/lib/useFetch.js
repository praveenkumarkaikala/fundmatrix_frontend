import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'

/** Minimal GET hook with reload + error handling. Pass null to skip. */
export function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    if (!url) {
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .get(url)
      .then((r) => {
        console.log(url,": data",r?.data);
        setData(r?.data)
        setError('')
      })
      .catch((e) => {
        console.log("error",e.response);
        setError(errorMessage(e))})
      .finally(() => setLoading(false))
  }, [url])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}

/**
 * fund-catalog-service no longer embeds NAV on scheme options (it would require an N-way
 * fan-out to nav-accounting-service on every catalogue read), so any page that lists scheme
 * options for the user to pick needs to fetch the latest NAV per option separately. Returns
 * a { [optionId]: navValue } map, fetched from nav-accounting-service one call per distinct
 * option. Pass the `schemes` array from a `/schemes` fetch (or null/undefined while loading).
 */
export function useOptionNavMap(schemes) {
  const [navByOption, setNavByOption] = useState({})

  useEffect(() => {
    const optionIds = []
    schemes?.forEach((s) => s.options.forEach((o) => optionIds.push(o.id)))
    if (optionIds.length === 0) return

    let cancelled = false
    Promise.allSettled(optionIds.map((id) => api.get(`/nav/latest/${id}`))).then((results) => {
      if (cancelled) return
      const next = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.data != null) next[optionIds[i]] = r.value.data
      })
      setNavByOption(next)
    })
    return () => {
      cancelled = true
    }
  }, [schemes])

  return navByOption
}
