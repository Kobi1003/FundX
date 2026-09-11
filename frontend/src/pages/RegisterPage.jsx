import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'

export default function RegisterPage() {
  return (
    <PageContainer title="Register">
      <Card>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Registration will create a Supabase Auth user + profile row.
        </p>
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <input className="w-full border border-black/15 px-3 py-2" placeholder="Full name" />
          <input className="w-full border border-black/15 px-3 py-2" placeholder="Email" />
          <select className="w-full border border-black/15 px-3 py-2" defaultValue="startup">
            <option value="startup">Startup</option>
            <option value="investor">Investor</option>
          </select>
          <Button>Create account</Button>
        </form>
      </Card>
    </PageContainer>
  )
}
