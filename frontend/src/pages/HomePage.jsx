import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { BentoGrid, BentoItem } from '../components/BentoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Rocket,
  ShieldCheck,
  Briefcase,
  ArrowRight,
  FileCheck2,
  LineChart,
  Handshake,
  Building2,
  Scale,
  Sparkles,
} from 'lucide-react'

const stats = [
  { label: 'Active rounds', value: '48', hint: 'Seed to Series B', tile: 'tile-emerald', valueClass: 'text-emerald-800' },
  { label: 'Verified investors', value: '126', hint: 'CV + registry checks', tile: 'tile-sky', valueClass: 'text-sky-800' },
  { label: 'Avg. AI score', value: '86', hint: 'Feasibility grade A', tile: 'tile-amber', valueClass: 'text-amber-800' },
  { label: 'Closed volume', value: '$42M', hint: 'Equity + royalty', tile: 'tile-violet', valueClass: 'text-violet-800' },
]

const features = [
  {
    icon: FileCheck2,
    title: 'Evidence-first verification',
    body: 'GST, CIN, MCA, and CV claims are checked before a party can negotiate.',
    iconClass: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: LineChart,
    title: '12-month simulations',
    body: 'Bull, base, and bear models sit next to every listed raise.',
    iconClass: 'bg-sky-50 text-sky-700',
  },
  {
    icon: Handshake,
    title: 'Shared dealroom',
    body: 'Term sheets, counters, and chat live on one negotiation tree.',
    iconClass: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Scale,
    title: 'Hybrid instruments',
    body: 'Equity plus royalty terms, payout caps, and close tracking.',
    iconClass: 'bg-violet-50 text-violet-700',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const handlePortalEntry = (_targetRole, targetPath) => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(targetPath)
  }

  return (
    <div className="space-y-6 pb-8">
      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card className="h-full overflow-hidden bg-primary text-primary-foreground">
            <CardHeader className="space-y-4 p-6 sm:p-8">
              <Badge variant="secondary" className="w-fit bg-primary-foreground/15 text-primary-foreground border-0">
                <Sparkles className="size-3" />
                Multi-agent investment OS
              </Badge>
              <CardTitle className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Raise, verify, and close hybrid venture deals in one workspace.
              </CardTitle>
              <CardDescription className="max-w-xl text-sm leading-relaxed text-primary-foreground/80">
                FundX connects founders and accredited syndicates with AI compliance audits, feasibility scores, and a live multi-party dealroom.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-3 px-6 pb-8 sm:px-8">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">Create account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/login">Sign in</Link>
              </Button>
            </CardFooter>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Marketplace pulse</CardTitle>
              <CardDescription>Live snapshot of the current FundX book.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className={`rounded-lg border p-3 ${stat.tile}`}>
                  <p className={`text-2xl font-semibold tabular-nums ${stat.valueClass}`}>{stat.value}</p>
                  <p className="mt-1 text-xs font-medium">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-2 xl:col-span-4">
          <Card className="flex h-full flex-col tile-amber">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/80 text-amber-800">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle>Admin portal</CardTitle>
              <CardDescription>Govern startups, investors, and marketplace liquidity from one desk.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
              <p>Directory reviews, GST/CIN re-audits, and closed-deal supervision.</p>
              <p>Downstream service health sits next to pending queues.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handlePortalEntry('admin', '/admin/dashboard')}>
                {user?.role === 'admin' ? 'Open admin' : 'Sign in as admin'}
                <ArrowRight />
              </Button>
            </CardFooter>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-2 xl:col-span-4">
          <Card className="flex h-full flex-col tile-emerald">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                <Rocket className="h-5 w-5" />
              </div>
              <CardTitle>Startup portal</CardTitle>
              <CardDescription>Verify the company, list a hybrid raise, and manage incoming offers.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
              <p>AI verifier, thesis upload, and bull/base/bear simulations.</p>
              <p>Dealroom for countersign and close.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handlePortalEntry('startup', '/startup/dashboard')}>
                {user?.role === 'startup' ? 'Open founder desk' : 'Continue as founder'}
                <ArrowRight />
              </Button>
            </CardFooter>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-2 xl:col-span-4">
          <Card className="flex h-full flex-col tile-sky">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100/80 text-sky-800">
                <Briefcase className="h-5 w-5" />
              </div>
              <CardTitle>Investor portal</CardTitle>
              <CardDescription>Filter listed rounds, review AI scores, and negotiate term sheets.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
              <p>CV accreditation is required before a binding offer.</p>
              <p>Pipeline, dealroom, and closed book in one view.</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handlePortalEntry('investor', '/investor/dashboard')}>
                {user?.role === 'investor' ? 'Open investor desk' : 'Continue as investor'}
                <ArrowRight />
              </Button>
            </CardFooter>
          </Card>
        </BentoItem>

        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <BentoItem key={feature.title} className="md:col-span-3 xl:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <div className={`mb-1 flex h-9 w-9 items-center justify-center rounded-md ${feature.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm">{feature.title}</CardTitle>
                  <CardDescription>{feature.body}</CardDescription>
                </CardHeader>
              </Card>
            </BentoItem>
          )
        })}

        <BentoItem className="md:col-span-6 xl:col-span-12">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>How a round moves through FundX</CardTitle>
                <CardDescription>Four steps from company file to executed term sheet.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/investor/deals">Browse listed deals</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { step: '01', title: 'Register & verify', body: 'Founders submit GST/CIN. Investors upload a CV for accreditation.', tile: 'tile-emerald', stepClass: 'text-emerald-700' },
                  { step: '02', title: 'List or filter', body: 'Publish a hybrid raise or screen the book by stage, sector, and interest.', tile: 'tile-sky', stepClass: 'text-sky-700' },
                  { step: '03', title: 'Score the round', body: 'AI feasibility, payout caps, and thesis sit on every deal card.', tile: 'tile-amber', stepClass: 'text-amber-700' },
                  { step: '04', title: 'Negotiate & close', body: 'Offers, counters, and signatures stay on one dealroom tree.', tile: 'tile-violet', stepClass: 'text-violet-700' },
                ].map((item, index) => (
                  <div key={item.step} className={`relative rounded-lg border p-4 ${item.tile}`}>
                    <p className={`text-xs font-medium ${item.stepClass}`}>{item.step}</p>
                    <p className="mt-2 text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    {index < 3 && <Separator className="absolute -right-2 top-1/2 hidden h-8 xl:block" orientation="vertical" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-12">
          <Card>
            <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Ready to join the next close?</p>
                  <p className="text-sm text-muted-foreground">
                    Create a founder or investor account, or explore the public marketplace first.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link to="/register?role=startup">Register as startup</Link>
                </Button>
                <Button asChild>
                  <Link to="/register?role=investor">Register as investor</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </BentoItem>
      </BentoGrid>
    </div>
  )
}
