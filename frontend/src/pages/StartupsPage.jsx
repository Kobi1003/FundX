import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function StartupsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listStartups()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageContainer title="Startups">
      <div className="mb-4">
        <Link to="/startups/new">
          <Button>New startup</Button>
        </Link>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id} title={s.name}>
            <p className="text-sm text-[var(--muted)]">{s.tagline || s.description || 'No description'}</p>
            <Link className="mt-2 inline-block text-sm text-[var(--brand)]" to={`/startups/${s.id}`}>
              View
            </Link>
          </Card>
        ))}
        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No startups yet.</p>
        ) : null}
      </div>
    </PageContainer>
  )
}
