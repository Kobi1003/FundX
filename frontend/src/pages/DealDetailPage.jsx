import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function DealDetailPage() {
  const { id } = useParams()
  const [deal, setDeal] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .getDeal(id)
      .then(setDeal)
      .catch((err) => setError(err.message))
  }, [id])

  return (
    <PageContainer title="Deal">
      {error ? <ErrorState message={error} /> : null}
      {!error && !deal ? <LoadingState /> : null}
      {deal ? (
        <Card title={deal.title}>
          <p className="text-sm">Startup ID: {deal.startup_id}</p>
          <p className="text-sm">Status: {deal.status}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Interests: {(deal.interests || []).length} (many investors per deal)
          </p>
        </Card>
      ) : null}
    </PageContainer>
  )
}
