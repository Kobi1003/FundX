import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function StartupAnalysisPage() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const sample = await api.demoSample()
      const data = await api.runStartupAnalysis({
        startup_id: id,
        name: sample.startup?.name || 'Demo Startup',
        industry: sample.startup?.industry,
        stage: sample.startup?.stage,
        metrics: sample.startup?.metrics || {},
      })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="Startup analysis">
      <Button onClick={runAnalysis} disabled={loading}>
        Run analysis
      </Button>
      {loading ? <LoadingState label="Running bounded AI workflow…" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {result ? (
        <Card title="Result" className="mt-4">
          <pre className="overflow-auto text-xs text-[var(--muted)]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      ) : null}
    </PageContainer>
  )
}
