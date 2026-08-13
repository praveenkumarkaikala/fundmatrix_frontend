import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'


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
