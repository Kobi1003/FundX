import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function DealsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listDeals()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageContainer title="Deals">
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <div className="space-y-3">
        {items.map((deal) => (
          <Card key={deal.id} title={deal.title}>
            <p className="text-sm text-[var(--muted)]">Status: {deal.status}</p>
            <Link className="text-sm text-[var(--brand)]" to={`/deals/${deal.id}`}>
              View deal
            </Link>
          </Card>
        ))}
        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No deals yet.</p>
        ) : null}
      </div>
    </PageContainer>
  )
}
