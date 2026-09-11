import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function InvestorDetailPage() {
  const { id } = useParams()
  const [investor, setInvestor] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .getInvestor(id)
      .then(setInvestor)
      .catch((err) => setError(err.message))
  }, [id])

  return (
    <PageContainer title="Investor">
      {error ? <ErrorState message={error} /> : null}
      {!error && !investor ? <LoadingState /> : null}
      {investor ? (
        <Card title={investor.display_name}>
          <p className="text-sm text-[var(--muted)]">{investor.bio || investor.thesis || 'No bio yet.'}</p>
          <p className="mt-2 text-sm">Firm: {investor.firm || '—'}</p>
        </Card>
      ) : null}
    </PageContainer>
  )
}
