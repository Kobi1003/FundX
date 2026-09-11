import { useEffect, useState } from 'react'

export function useApi(apiFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    apiFn()
      .then((res) => {
        if (isMounted) setData(res)
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'API request failed')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, deps)

  return { data, loading, error, refetch: () => apiFn().then(setData) }
}

export default useApi
