import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'

export default function LoginPage() {
  return (
    <PageContainer title="Login">
      <Card>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Supabase Auth will own authentication. Placeholder form only.
        </p>
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <input className="w-full border border-black/15 px-3 py-2" placeholder="Email" />
          <input
            className="w-full border border-black/15 px-3 py-2"
            placeholder="Password"
            type="password"
          />
          <Button>Sign in</Button>
        </form>
      </Card>
    </PageContainer>
  )
}
