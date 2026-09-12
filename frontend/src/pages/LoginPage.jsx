import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext, DEMO_ACCOUNTS } from '../context/AuthContext'
import api from '../services/api'
import { BentoGrid, BentoItem } from '../components/BentoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, loginAs } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@fundx.ai'
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (email.trim().toLowerCase() === adminEmail.toLowerCase()) {
      if (password && password !== adminPassword) {
        setError('Invalid admin password')
        setLoading(false)
        return
      }
      loginAs('admin')
      navigate('/admin/dashboard')
      setLoading(false)
      return
    }

    try {
      const res = await api.login({ email, password })
      setUser(res.user)
      if (res.user?.role === 'admin') navigate('/admin/dashboard')
      else if (res.user?.role === 'startup') navigate('/startup/dashboard')
      else navigate('/investor/dashboard')
    } catch (err) {
      if (email.toLowerCase().includes('founder') || email.toLowerCase().includes('startup')) {
        loginAs('startup')
        navigate('/startup/dashboard')
      } else if (email.toLowerCase().includes('investor') || email.toLowerCase().includes('apex')) {
        loginAs('investor')
        navigate('/investor/dashboard')
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const enterDemo = (key, path) => {
    loginAs(key)
    navigate(path)
  }

  return (
    <div className="py-8">
      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in to FundX</CardTitle>
              <CardDescription>Use your portal account to open the desk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>Need an account?</span>
                <div className="flex gap-2">
                  <Button asChild variant="link" size="sm">
                    <Link to="/register?role=startup">Startup</Link>
                  </Button>
                  <Button asChild variant="link" size="sm">
                    <Link to="/register?role=investor">Investor</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Demo workspaces</CardTitle>
              <CardDescription>Jump into a role without creating an account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => enterDemo('investor', '/investor/dashboard')}
                className="tile-sky w-full rounded-lg border p-4 text-left transition-colors hover:bg-sky-100/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{DEMO_ACCOUNTS.investor.full_name}</p>
                  <Badge variant="info">Investor</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{DEMO_ACCOUNTS.investor.firm}</p>
              </button>
              <button
                type="button"
                onClick={() => enterDemo('startup', '/startup/dashboard')}
                className="tile-emerald w-full rounded-lg border p-4 text-left transition-colors hover:bg-emerald-100/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{DEMO_ACCOUNTS.startup.full_name}</p>
                  <Badge variant="success">Founder</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{DEMO_ACCOUNTS.startup.startup_name}</p>
              </button>
              <button
                type="button"
                onClick={() => enterDemo('admin', '/admin/dashboard')}
                className="tile-amber w-full rounded-lg border p-4 text-left transition-colors hover:bg-amber-100/70"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{DEMO_ACCOUNTS.admin.full_name}</p>
                  <Badge variant="warning">Admin</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Platform governance</p>
              </button>
            </CardContent>
          </Card>
        </BentoItem>
      </BentoGrid>
    </div>
  )
}
