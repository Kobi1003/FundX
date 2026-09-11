import { useEffect, useState } from 'react'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function DashboardPage() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <PageContainer title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Gateway health">
          {error ? <ErrorState message={error} /> : null}
          {!error && !health ? <LoadingState /> : null}
          {health ? (
            <pre className="overflow-auto text-xs text-[var(--muted)]">
              {JSON.stringify(health, null, 2)}
            </pre>
          ) : null}
        </Card>
        <Card title="Scaffold status">
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            <li>API Gateway + microservices</li>
            <li>AI service with cache + DEMO_MODE</li>
            <li>Deterministic simulation engine</li>
            <li>Neo4j + hosted Supabase hooks</li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  )
}
