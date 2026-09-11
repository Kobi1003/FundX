import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function StartupDetailPage() {
  const { id } = useParams()
  const [startup, setStartup] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .getStartup(id)
      .then(setStartup)
      .catch((err) => setError(err.message))
  }, [id])

  return (
    <PageContainer title="Startup">
      {error ? <ErrorState message={error} /> : null}
      {!error && !startup ? <LoadingState /> : null}
      {startup ? (
        <Card title={startup.name}>
          <p className="text-sm text-[var(--muted)]">{startup.description || startup.tagline}</p>
          <p className="mt-2 text-sm">Industry: {startup.industry || '—'}</p>
          <p className="text-sm">Stage: {startup.stage || '—'}</p>
          <Link to={`/startups/${id}/analysis`} className="mt-4 inline-block">
            <Button>View analysis</Button>
          </Link>
        </Card>
      ) : null}
    </PageContainer>
  )
}
