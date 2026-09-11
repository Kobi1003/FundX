import { Link } from 'react-router-dom'
import Button from '../components/Button'
import PageContainer from '../components/PageContainer'

export default function HomePage() {
  return (
    <PageContainer>
      <div className="py-16">
        <p className="text-4xl font-semibold tracking-tight text-[var(--brand)] md:text-5xl">
          AI Investment Arena
        </p>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          Startup investment marketplace powered by agentic analysis, deterministic simulation, and
          deal rooms.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/dashboard">
            <Button>Open dashboard</Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary">Register</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  )
}
