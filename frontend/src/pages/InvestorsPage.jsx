import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function InvestorsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listInvestors()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageContainer title="Investors">
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <div className="space-y-3">
        {items.map((inv) => (
          <Card key={inv.id} title={inv.display_name}>
            <p className="text-sm text-[var(--muted)]">{inv.firm || 'Independent'}</p>
            <Link className="text-sm text-[var(--brand)]" to={`/investors/${inv.id}`}>
              View
            </Link>
          </Card>
        ))}
        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No investors yet.</p>
        ) : null}
      </div>
    </PageContainer>
  )
}
