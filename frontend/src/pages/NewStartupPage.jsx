import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'

export default function NewStartupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    industry: '',
    stage: 'Seed',
    thesis: '',
  })

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const created = await api.createStartup(form)
      navigate(`/startups/${created.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <PageContainer title="New startup">
      <Card>
        {error ? <ErrorState message={error} /> : null}
        <form className="mt-2 space-y-3" onSubmit={onSubmit}>
          {['name', 'tagline', 'industry', 'stage', 'thesis'].map((field) => (
            <input
              key={field}
              className="w-full border border-black/15 px-3 py-2"
              placeholder={field}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required={field === 'name'}
            />
          ))}
          <Button type="submit">Create</Button>
        </form>
      </Card>
    </PageContainer>
  )
}
