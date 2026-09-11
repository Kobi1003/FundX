import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function DealRoomPage() {
  const { id } = useParams()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .getDealRoom(id)
      .then(setRoom)
      .catch((err) => setError(err.message))
  }, [id])

  return (
    <PageContainer title="Deal room">
      {error ? <ErrorState message={error} /> : null}
      {!error && !room ? <LoadingState /> : null}
      {room ? (
        <Card title={room.name || 'Deal room'}>
          <p className="text-sm">Deal ID: {room.deal_id}</p>
          <p className="text-sm text-[var(--muted)]">
            Participants: {(room.participant_ids || []).join(', ') || 'none'} — multi-party, not 1:1
          </p>
        </Card>
      ) : null}
    </PageContainer>
  )
}
