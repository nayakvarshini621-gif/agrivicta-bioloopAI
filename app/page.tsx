'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Coins,
  FilePlus2,
  Filter,
  Leaf,
  Menu,
  PackageCheck,
  Recycle,
  Search,
  Sprout,
  Truck,
  Upload,
  Users,
  X,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Info,
  Calendar,
  MapPin,
  Sparkles,
  Database,
  RefreshCw,
  Cloud,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import {
  Resource,
  ResourceRequest,
  Exchange,
  CostEstimate,
  MatchResult,
  initialResources,
  initialRequests,
  initialExchanges,
  initialCostEstimates,
  getAdvisorSuggestions,
  evaluateMatches,
  AdvisorSuggestion,
} from '@/lib/store'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  fetchResourcesFromSupabase,
  fetchRequestsFromSupabase,
  fetchExchangesFromSupabase,
  fetchCostEstimatesFromSupabase,
  insertResourceToSupabase,
  updateResourceStatusInSupabase,
  insertExchangeToSupabase,
  updateExchangeInSupabase,
  insertCostEstimateToSupabase,
  seedSupabaseIfEmpty,
  resetSupabaseData,
} from '@/lib/supabase-service'

type View = 'overview' | 'advisor' | 'exchange' | 'matches' | 'calculator' | 'impact'

const navItems: { id: View; label: string; icon: typeof Leaf }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'advisor', label: 'AI Resource Advisor', icon: Sprout },
  { id: 'exchange', label: 'MittiBank Exchange', icon: Recycle },
  { id: 'matches', label: 'Smart Matches', icon: Users },
  { id: 'calculator', label: 'Cost Calculator', icon: Coins },
  { id: 'impact', label: 'Impact Tracker', icon: ClipboardCheck },
]

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-[#dfeadd] text-[#245c3a] shadow-sm">
        <Recycle size={22} />
      </div>
      <div>
        <div className="text-[15px] font-bold tracking-tight text-[#173b29]">AgriVicta</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#77917c]">BioLoop AI</div>
      </div>
    </div>
  )
}

function Badge({
  children,
  tone = 'sage',
}: {
  children: React.ReactNode
  tone?: 'sage' | 'gold' | 'brown' | 'dark' | 'red' | 'blue'
}) {
  const colors = {
    sage: 'bg-[#e5f0e6] text-[#2d6b46] border border-[#cbe3ce]',
    gold: 'bg-[#f7eed2] text-[#876d25] border border-[#ebdcb0]',
    brown: 'bg-[#efe5db] text-[#795339] border border-[#e1d2c2]',
    dark: 'bg-[#e4eee7] text-[#245c3a] border border-[#cbe1d0]',
    red: 'bg-[#fde8e8] text-[#9b1c1c] border border-[#f8b4b4]',
    blue: 'bg-[#e1effe] text-[#1e429f] border border-[#b3c5ff]',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colors[tone]}`}>
      {children}
    </span>
  )
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <Badge tone="dark">{eyebrow}</Badge>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173b29]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e8373]">{description}</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  badgeText,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Leaf
  badgeText?: string
}) {
  return (
    <div className="rounded-2xl border border-[#e2e8df] bg-white p-5 shadow-[0_4px_18px_rgba(31,63,39,0.04)] transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#78907d]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#193c2a]">{value}</p>
        </div>
        <div className="rounded-xl bg-[#e8f1e7] p-2.5 text-[#2d7047]">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-[#8da092]">{detail}</p>
        {badgeText && <span className="text-[10px] font-medium text-[#77917c]">{badgeText}</span>}
      </div>
    </div>
  )
}

export default function Page() {
  const [view, setView] = useState<View>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Core reactive data stores
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [requests, setRequests] = useState<ResourceRequest[]>(initialRequests)
  const [exchanges, setExchanges] = useState<Exchange[]>(initialExchanges)
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>(initialCostEstimates)
  const [isLoaded, setIsLoaded] = useState(false)

  // Supabase Database States
  const [isSupabaseMode, setIsSupabaseMode] = useState(false)
  const [isLoadingDb, setIsLoadingDb] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4500)
  }

  // Initial Load: check Supabase or fallback to LocalStorage
  useEffect(() => {
    async function initData() {
      const configured = isSupabaseConfigured()
      setIsSupabaseMode(configured)

      if (configured) {
        setIsLoadingDb(true)
        try {
          // Attempt to seed if Supabase database is completely empty
          await seedSupabaseIfEmpty()

          // Fetch all records in parallel
          const [resData, reqData, excData, estData] = await Promise.all([
            fetchResourcesFromSupabase(),
            fetchRequestsFromSupabase(),
            fetchExchangesFromSupabase(),
            fetchCostEstimatesFromSupabase(),
          ])

          if (resData && resData.length > 0) setResources(resData)
          if (reqData && reqData.length > 0) setRequests(reqData)
          if (excData && excData.length > 0) setExchanges(excData)
          if (estData && estData.length > 0) setCostEstimates(estData)

          showToast('Connected to Supabase PostgreSQL. Cloud records loaded!')
        } catch (err) {
          console.error('Supabase load error:', err)
          loadFromLocalStorage()
          showToast('Supabase connection error. Loaded from local browser storage.')
        } finally {
          setIsLoadingDb(false)
        }
      } else {
        loadFromLocalStorage()
      }
      setIsLoaded(true)
    }

    function loadFromLocalStorage() {
      try {
        const savedRes = localStorage.getItem('agrivicta_resources_v1')
        const savedReq = localStorage.getItem('agrivicta_requests_v1')
        const savedExc = localStorage.getItem('agrivicta_exchanges_v1')
        const savedEst = localStorage.getItem('agrivicta_estimates_v1')

        if (savedRes) setResources(JSON.parse(savedRes))
        if (savedReq) setRequests(JSON.parse(savedReq))
        if (savedExc) setExchanges(JSON.parse(savedExc))
        if (savedEst) setCostEstimates(JSON.parse(savedEst))
      } catch {
        // Fallback to initial constants
      }
    }

    initData()
  }, [])

  // Sync to localStorage as continuous client backup
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem('agrivicta_resources_v1', JSON.stringify(resources))
      localStorage.setItem('agrivicta_requests_v1', JSON.stringify(requests))
      localStorage.setItem('agrivicta_exchanges_v1', JSON.stringify(exchanges))
      localStorage.setItem('agrivicta_estimates_v1', JSON.stringify(costEstimates))
    } catch {
      // Ignore write error
    }
  }, [resources, requests, exchanges, costEstimates, isLoaded])

  // Explicit refresh from database
  const refreshFromDatabase = async () => {
    if (!isSupabaseMode) {
      showToast('Running in local demo mode. Add Supabase credentials in .env.local for cloud sync.')
      return
    }
    setIsSyncing(true)
    try {
      const [resData, reqData, excData, estData] = await Promise.all([
        fetchResourcesFromSupabase(),
        fetchRequestsFromSupabase(),
        fetchExchangesFromSupabase(),
        fetchCostEstimatesFromSupabase(),
      ])
      if (resData) setResources(resData)
      if (reqData) setRequests(reqData)
      if (excData) setExchanges(excData)
      if (estData) setCostEstimates(estData)
      showToast('Data refreshed successfully from Supabase!')
    } catch (err) {
      console.error('Refresh error:', err)
      showToast('Failed to refresh data from Supabase.')
    } finally {
      setIsSyncing(false)
    }
  }

  // Reset demo records
  const resetDemoData = async () => {
    if (confirm('Reset all demonstration data to default hackathon records?')) {
      if (isSupabaseMode) {
        setIsLoadingDb(true)
        await resetSupabaseData()
        setIsLoadingDb(false)
      }
      setResources(initialResources)
      setRequests(initialRequests)
      setExchanges(initialExchanges)
      setCostEstimates(initialCostEstimates)
      try {
        localStorage.removeItem('agrivicta_resources_v1')
        localStorage.removeItem('agrivicta_requests_v1')
        localStorage.removeItem('agrivicta_exchanges_v1')
        localStorage.removeItem('agrivicta_estimates_v1')
      } catch {}
      showToast('Demo data reset to clean initial state.')
    }
  }

  // Live computed metrics directly from application records
  const stats = useMemo(() => {
    const totalListedKg = resources.reduce((acc, r) => {
      const mult = r.unit === 'tonnes' ? 1000 : 1
      return acc + r.quantity * mult
    }, 0)

    const totalCollectedKg = exchanges.reduce((acc, e) => {
      const mult = e.unit === 'tonnes' ? 1000 : 1
      return acc + (e.quantity_collected || 0) * mult
    }, 0)

    const totalReusedKg = exchanges.reduce((acc, e) => {
      const mult = e.unit === 'tonnes' ? 1000 : 1
      return acc + (e.quantity_reused || 0) * mult
    }, 0)

    const totalMatchedKg = exchanges.reduce((acc, e) => {
      const mult = e.unit === 'tonnes' ? 1000 : 1
      return acc + e.quantity * mult
    }, 0)

    const totalSavings = costEstimates.reduce((acc, c) => acc + c.estimated_savings, 0)
    const completedExchangesCount = exchanges.filter((e) => e.status === 'confirmed_reused').length

    return {
      listedKg: totalListedKg,
      collectedKg: totalCollectedKg,
      reusedKg: totalReusedKg,
      matchedKg: totalMatchedKg,
      savings: totalSavings,
      completedExchanges: completedExchangesCount,
      activeListingsCount: resources.filter((r) => r.status === 'available').length,
    }
  }, [resources, exchanges, costEstimates])

  // Active matches calculated via transparent rules
  const matches = useMemo(() => evaluateMatches(resources, requests), [resources, requests])

  // Handlers for workflow transitions with Supabase persistence
  const handleAddResource = async (newRes: Resource) => {
    setResources((prev) => [newRes, ...prev])

    if (isSupabaseMode) {
      const success = await insertResourceToSupabase(newRes)
      if (success) {
        showToast(`"${newRes.material_name}" saved to Supabase & listed on MittiBank (${newRes.id})!`)
      } else {
        showToast(`"${newRes.material_name}" listed locally (Supabase write error).`)
      }
    } else {
      showToast(`"${newRes.material_name}" listed on MittiBank (${newRes.id})!`)
    }
    setView('exchange')
  }

  const handleInitiateExchange = async (match: MatchResult) => {
    const newExc: Exchange = {
      id: `exc-${Date.now().toString().slice(-5)}`,
      resource_id: match.resource.id,
      request_id: match.request.id,
      resource_name: match.resource.material_name,
      requester_name: match.request.requester_name,
      quantity: Math.min(match.resource.quantity, match.request.quantity),
      unit: match.resource.unit,
      status: 'matched',
      quantity_collected: 0,
      quantity_reused: 0,
      collected_at: null,
      reuse_confirmed_at: null,
      created_at: new Date().toISOString(),
      notes: `Matched via Smart Matching (${match.score}% fit). Intended use: ${match.request.intended_use}.`,
    }

    // Optimistically update resource and request state
    setResources((prev) =>
      prev.map((r) => (r.id === match.resource.id ? { ...r, status: 'matched' } : r))
    )

    setRequests((prev) =>
      prev.map((req) => (req.id === match.request.id ? { ...req, status: 'matched' } : req))
    )

    setExchanges((prev) => [newExc, ...prev])

    if (isSupabaseMode) {
      await insertExchangeToSupabase(newExc)
      await updateResourceStatusInSupabase(match.resource.id, 'matched')
      showToast(`Exchange initiated and persisted to Supabase!`)
    } else {
      showToast(`Exchange initiated between ${match.resource.material_name} and ${match.request.requester_name}!`)
    }
    setView('impact')
  }

  const handleRecordCollection = async (exchangeId: string, collectedQty: number) => {
    const collectedTimestamp = new Date().toISOString()
    setExchanges((prev) =>
      prev.map((exc) => {
        if (exc.id === exchangeId) {
          return {
            ...exc,
            status: 'collected',
            quantity_collected: collectedQty,
            collected_at: collectedTimestamp,
          }
        }
        return exc
      })
    )

    const target = exchanges.find((e) => e.id === exchangeId)
    if (target) {
      setResources((prev) =>
        prev.map((r) => (r.id === target.resource_id ? { ...r, status: 'collected' } : r))
      )
    }

    if (isSupabaseMode) {
      await updateExchangeInSupabase(exchangeId, {
        status: 'collected',
        quantity_collected: collectedQty,
        collected_at: collectedTimestamp,
      })
      if (target) {
        await updateResourceStatusInSupabase(target.resource_id, 'collected')
      }
      showToast(`Collection recorded: ${collectedQty} units verified (synced to Supabase).`)
    } else {
      showToast(`Collection recorded: ${collectedQty} units verified.`)
    }
  }

  const handleConfirmReuse = async (exchangeId: string, reusedQty: number) => {
    const reuseTimestamp = new Date().toISOString()
    setExchanges((prev) =>
      prev.map((exc) => {
        if (exc.id === exchangeId) {
          return {
            ...exc,
            status: 'confirmed_reused',
            quantity_reused: reusedQty,
            reuse_confirmed_at: reuseTimestamp,
          }
        }
        return exc
      })
    )

    const target = exchanges.find((e) => e.id === exchangeId)
    if (target) {
      setResources((prev) =>
        prev.map((r) => (r.id === target.resource_id ? { ...r, status: 'reused' } : r))
      )
    }

    if (isSupabaseMode) {
      await updateExchangeInSupabase(exchangeId, {
        status: 'confirmed_reused',
        quantity_reused: reusedQty,
        reuse_confirmed_at: reuseTimestamp,
      })
      if (target) {
        await updateResourceStatusInSupabase(target.resource_id, 'reused')
      }
      showToast(`Confirmed reuse recorded: ${reusedQty} units (synced to Supabase)!`)
    } else {
      showToast(`Confirmed reuse recorded: ${reusedQty} units confirmed!`)
    }
  }

  const handleSaveCostEstimate = async (estimate: CostEstimate) => {
    setCostEstimates((prev) => [estimate, ...prev])

    if (isSupabaseMode) {
      await insertCostEstimateToSupabase(estimate)
      showToast(`Cost estimate of ₹${estimate.estimated_savings.toLocaleString('en-IN')} saved to Supabase!`)
    } else {
      showToast(`Cost estimate of ₹${estimate.estimated_savings.toLocaleString('en-IN')} saved to Tracker!`)
    }
  }

  const active = navItems.find((x) => x.id === view) ?? navItems[0]

  return (
    <main className="min-h-screen bg-[#f6f8f3] text-[#23442f]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#173b29] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <Check size={18} className="text-[#a0d9b4]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Database Loading Spinner Overlay */}
      {isLoadingDb && (
        <div className="fixed top-3 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#cbe1d0] bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#245c3a] shadow-lg backdrop-blur">
          <RefreshCw size={14} className="animate-spin text-[#2d7047]" />
          <span>Connecting to Supabase PostgreSQL...</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r border-[#e1e9df] bg-[#fbfcf9] px-5 py-6 lg:flex">
        <Logo />
        <div className="mt-10">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#99a99b]">BioLoop Workspace</p>
          <nav className="mt-3 flex flex-col gap-1.5">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${
                  view === id
                    ? 'bg-[#e4efe3] text-[#245c3a] shadow-sm'
                    : 'text-[#708374] hover:bg-[#f0f5ee] hover:text-[#315d3d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} />
                  {label}
                </div>
                {id === 'matches' && matches.length > 0 && (
                  <span className="rounded-full bg-[#245c3a] px-2 py-0.5 text-[10px] font-bold text-white">
                    {matches.length}
                  </span>
                )}
                {id === 'exchange' && stats.activeListingsCount > 0 && (
                  <span className="rounded-full bg-[#e8f1e7] px-2 py-0.5 text-[10px] font-bold text-[#2d7047]">
                    {stats.activeListingsCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Database Status & Controls */}
        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-2xl border border-[#dbe7d7] bg-[#edf4eb] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSupabaseMode ? (
                  <Database size={15} className="text-[#2d7047]" />
                ) : (
                  <ShieldCheck size={15} className="text-[#3b7c4d]" />
                )}
                <p className="text-xs font-bold text-[#255734]">
                  {isSupabaseMode ? 'Supabase Connected' : 'Local Demo Mode'}
                </p>
              </div>
              <span
                className={`size-2 rounded-full ${
                  isSupabaseMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#6c8571]">
              {isSupabaseMode
                ? 'Records are stored and synced live in Supabase PostgreSQL.'
                : 'Browser persistent storage active. Supabase connection ready.'}
            </p>

            <div className="mt-3 flex flex-col gap-1.5">
              {isSupabaseMode ? (
                <button
                  onClick={refreshFromDatabase}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d7047] hover:underline"
                >
                  <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? 'Syncing...' : 'Sync with Supabase'}
                </button>
              ) : (
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d7047] hover:underline"
                >
                  <ExternalLink size={12} /> Supabase Setup Guide
                </button>
              )}

              <button
                onClick={resetDemoData}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64806a] hover:underline"
              >
                <RotateCcw size={12} /> Reset demo records
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e1e9df] bg-[#fbfcf9]/95 px-5 backdrop-blur lg:hidden">
        <Logo />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          className="rounded-xl p-2 text-[#315d3d] hover:bg-[#edf4eb]"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <nav className="sticky top-[72px] z-30 flex flex-col gap-1 border-b border-[#e1e9df] bg-[#fbfcf9] p-4 lg:hidden">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setView(id)
                setMenuOpen(false)
              }}
              className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-semibold ${
                view === id ? 'bg-[#e4efe3] text-[#245c3a]' : 'text-[#708374]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} />
                {label}
              </div>
              {id === 'matches' && (
                <span className="rounded-full bg-[#245c3a] px-2 py-0.5 text-[10px] font-bold text-white">
                  {matches.length}
                </span>
              )}
            </button>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-[#e2e8df] pt-3">
            <button
              onClick={() => {
                setShowConfigModal(true)
                setMenuOpen(false)
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#dce6da] p-2.5 text-xs font-bold text-[#355f41]"
            >
              <Database size={13} /> Supabase Setup Guide
            </button>
            <button
              onClick={() => {
                resetDemoData()
                setMenuOpen(false)
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#dce6da] p-2.5 text-xs font-medium text-[#6c8571]"
            >
              <RotateCcw size={13} /> Reset records
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-[252px]">
        {/* Top Header Bar */}
        <header className="hidden h-[72px] items-center justify-between border-b border-[#e1e9df] bg-[#fbfcf9] px-8 lg:flex">
          <div>
            <p className="text-xs font-medium text-[#8a9b8e]">
              AgriVicta BioLoop / <span className="font-semibold text-[#315d3d]">{active.label}</span>
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#20442c]">Maharashtra Community Agricultural Network</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={isSupabaseMode ? 'sage' : 'gold'}>
              {isSupabaseMode ? (
                <>
                  <Database size={12} className="mr-1.5 inline" />
                  Database: Supabase Cloud (PostgreSQL)
                </>
              ) : (
                <>
                  <ShieldCheck size={12} className="mr-1.5 inline" />
                  Database: Local Persistent Mode
                </>
              )}
            </Badge>

            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbe1d0] bg-white px-3 py-2 text-xs font-semibold text-[#285736] hover:bg-[#f3f7f2]"
            >
              <Database size={13} /> DB Config
            </button>

            <button
              onClick={() => setView('advisor')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#245c3a] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1a492d]"
            >
              <FilePlus2 size={14} /> Add Resource
            </button>
          </div>
        </header>

        {/* Dynamic Section Render */}
        <div className="mx-auto max-w-[1440px] p-5 md:p-8 xl:p-10">
          {view === 'overview' && (
            <OverviewSection
              stats={stats}
              resources={resources}
              exchanges={exchanges}
              matchesCount={matches.length}
              isSupabase={isSupabaseMode}
              go={setView}
            />
          )}
          {view === 'advisor' && <AdvisorSection onAddResource={handleAddResource} go={setView} />}
          {view === 'exchange' && <ExchangeSection resources={resources} go={setView} />}
          {view === 'matches' && (
            <MatchesSection
              matches={matches}
              onInitiateExchange={handleInitiateExchange}
              go={setView}
            />
          )}
          {view === 'calculator' && <CalculatorSection onSaveEstimate={handleSaveCostEstimate} />}
          {view === 'impact' && (
            <ImpactSection
              stats={stats}
              exchanges={exchanges}
              resources={resources}
              onRecordCollection={handleRecordCollection}
              onConfirmReuse={handleConfirmReuse}
              go={setView}
            />
          )}
        </div>
      </div>

      {/* Supabase Database Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-[#d8e5d5] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#edf1eb] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#e5efe3] text-[#2d7047]">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1f442c]">Supabase PostgreSQL Integration</h3>
                  <p className="text-xs text-[#718575]">
                    Status:{' '}
                    <span
                      className={`font-semibold ${
                        isSupabaseMode ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isSupabaseMode ? '● Connected & Active' : '○ Local Demo Mode (Unconfigured)'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="rounded-lg p-1.5 text-[#6c8571] hover:bg-[#edf4eb]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4 text-xs leading-5 text-[#4b6351]">
              <div className="rounded-xl bg-[#f7faf6] p-4 border border-[#e2ece0]">
                <p className="font-bold text-[#23442f]">Quick 3-Step Setup Instructions:</p>
                <ol className="mt-2 list-decimal pl-4 flex flex-col gap-2">
                  <li>
                    <strong>Create tables & RLS policies:</strong> Open your Supabase Dashboard, go to <strong>SQL Editor</strong>, open the provided file <code className="rounded bg-white px-1.5 py-0.5 border text-[#2b5435]">supabase-schema.sql</code>, and click <strong>Run</strong>.
                  </li>
                  <li>
                    <strong>Get API credentials:</strong> In Supabase Dashboard, go to <strong>Project Settings → API</strong>. Copy the <strong>Project URL</strong> and <strong>anon public</strong> key.
                  </li>
                  <li>
                    <strong>Configure local environment:</strong> Add the credentials into <code className="rounded bg-white px-1.5 py-0.5 border text-[#2b5435]">.env.local</code> in this project folder:
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-[#193c28] p-3 text-[11px] text-[#e0f1e2]">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
                    </pre>
                  </li>
                </ol>
              </div>

              <div className="rounded-xl border border-[#dfeada] bg-[#edf4eb] p-3.5">
                <p className="font-semibold text-[#255734]">Vercel Production Deployment:</p>
                <p className="mt-1 text-[11px] text-[#5d7763]">
                  Add <code className="bg-white px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-white px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your Vercel Project Settings → Environment Variables.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[#edf1eb] pt-4">
              <button
                onClick={() => setShowConfigModal(false)}
                className="rounded-xl bg-[#245c3a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#18462a]"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

/* =========================================================================
   1. OVERVIEW SECTION (DASHBOARD)
   ========================================================================= */
function OverviewSection({
  stats,
  resources,
  exchanges,
  matchesCount,
  isSupabase,
  go,
}: {
  stats: {
    listedKg: number
    collectedKg: number
    reusedKg: number
    matchedKg: number
    savings: number
    completedExchanges: number
    activeListingsCount: number
  }
  resources: Resource[]
  exchanges: Exchange[]
  matchesCount: number
  isSupabase: boolean
  go: (v: View) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge tone="dark">BioLoop Dashboard · October 2026</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173b29] md:text-[34px]">
            Welcome, Community Agro Loop.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e8373]">
            Turn agricultural residues into verified local bio-inputs. Track what is listed, matched, physically collected, and confirmed reused.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => go('advisor')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#245c3a] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#19472c]"
          >
            <FilePlus2 size={17} /> Add a resource
          </button>
          <button
            onClick={() => go('matches')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c5d8c5] bg-white px-4 py-3 text-sm font-semibold text-[#285736] hover:bg-[#f3f7f2]"
          >
            <Users size={17} /> View {matchesCount} Matches
          </button>
        </div>
      </section>

      {/* Live Application Record Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Resources listed"
          value={`${stats.listedKg.toLocaleString('en-IN')} kg`}
          detail={`${resources.length} active records in loop`}
          icon={PackageCheck}
          badgeText={isSupabase ? 'Supabase DB' : 'Verified counts'}
        />
        <StatCard
          label="Material collected"
          value={`${stats.collectedKg.toLocaleString('en-IN')} kg`}
          detail={`Recorded across ${exchanges.length} exchanges`}
          icon={Truck}
          badgeText="Recorded only"
        />
        <StatCard
          label="Material reused"
          value={`${stats.reusedKg.toLocaleString('en-IN')} kg`}
          detail={`${stats.completedExchanges} confirmed closures`}
          icon={Recycle}
          badgeText="Farmer confirmed"
        />
        <StatCard
          label="Estimated savings"
          value={`₹${stats.savings.toLocaleString('en-IN')}`}
          detail="Calculated from cost models"
          icon={Coins}
          badgeText="Estimated"
        />
      </div>

      {/* Resource Loop & Reuse Activity Graph */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl bg-[#245c3a] p-6 text-white shadow-md">
          <Badge tone="sage">The 5-Step BioLoop Workflow</Badge>
          <h2 className="mt-4 max-w-md text-2xl font-bold leading-tight">
            One harvest residue can enrich the next season.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#d3e5d5]">
            1. Describe residue in Advisor → 2. Review transparent safety guidance → 3. List in MittiBank → 4. Match with nearby demand → 5. Record collection & confirm reuse.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[#d6e9d6]">
            <button
              onClick={() => go('advisor')}
              className="rounded-full bg-white/10 px-3.5 py-2 transition hover:bg-white/20"
            >
              1. Resource Advisor →
            </button>
            <button
              onClick={() => go('exchange')}
              className="rounded-full bg-white/10 px-3.5 py-2 transition hover:bg-white/20"
            >
              2. MittiBank Board →
            </button>
            <button
              onClick={() => go('matches')}
              className="rounded-full bg-white/10 px-3.5 py-2 transition hover:bg-white/20"
            >
              3. Smart Matches ({matchesCount}) →
            </button>
            <button
              onClick={() => go('calculator')}
              className="rounded-full bg-white/10 px-3.5 py-2 transition hover:bg-white/20"
            >
              4. Cost Calculator →
            </button>
            <button
              onClick={() => go('impact')}
              className="rounded-full bg-white/10 px-3.5 py-2 transition hover:bg-white/20"
            >
              5. Impact Tracker →
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e2e8df] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#284b34]">Resource Conversion Ratio</h2>
              <p className="mt-1 text-xs text-[#8a9b8e]">Current season progress</p>
            </div>
            <Badge tone="gold">Verified Flow</Badge>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#48634e]">
                <span>Listed to Matched</span>
                <span>
                  {stats.listedKg > 0 ? Math.round((stats.matchedKg / stats.listedKg) * 100) : 0}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#ecf2eb]">
                <div
                  className="h-2 rounded-full bg-[#82ab80]"
                  style={{
                    width: `${stats.listedKg > 0 ? Math.min(100, Math.round((stats.matchedKg / stats.listedKg) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#48634e]">
                <span>Matched to Collected</span>
                <span>
                  {stats.matchedKg > 0 ? Math.round((stats.collectedKg / stats.matchedKg) * 100) : 0}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#ecf2eb]">
                <div
                  className="h-2 rounded-full bg-[#5d915b]"
                  style={{
                    width: `${stats.matchedKg > 0 ? Math.min(100, Math.round((stats.collectedKg / stats.matchedKg) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#48634e]">
                <span>Collected to Confirmed Reused</span>
                <span>
                  {stats.collectedKg > 0 ? Math.round((stats.reusedKg / stats.collectedKg) * 100) : 0}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#ecf2eb]">
                <div
                  className="h-2 rounded-full bg-[#245c3a]"
                  style={{
                    width: `${stats.collectedKg > 0 ? Math.min(100, Math.round((stats.reusedKg / stats.collectedKg) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <p className="mt-5 text-[11px] leading-4 text-[#8ea091]">
            Standard: Quantities do not count as collected until physical pickup is marked; reuse requires receiving farmer confirmation.
          </p>
        </section>
      </div>

      {/* Recent Resources in Loop */}
      <section className="rounded-2xl border border-[#e2e8df] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#284b34]">Active Community Listings</h2>
            <p className="mt-1 text-xs text-[#8a9b8e]">Current resources recorded in the exchange</p>
          </div>
          <button
            onClick={() => go('exchange')}
            className="text-xs font-bold text-[#2d7047] hover:underline"
          >
            View all ({resources.length}) <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {resources.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-[#e8efe6] bg-[#f7faf6] p-4 transition hover:border-[#c5dcc3]"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[#e2ede0] text-[#306841]">
                    <Leaf size={16} />
                  </div>
                  <Badge
                    tone={
                      item.status === 'available'
                        ? 'sage'
                        : item.status === 'matched'
                        ? 'gold'
                        : 'brown'
                    }
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="mt-3 font-bold text-[#284b34]">{item.material_name}</h3>
                <p className="mt-1 text-xs text-[#718575]">
                  {item.quantity} {item.unit} · {item.location}
                </p>
                <p className="mt-3 text-xs font-semibold text-[#4c6853]">Intended: {item.intended_use}</p>
              </div>
              <div className="mt-4 border-t border-[#e2ece0] pt-3 text-[11px] text-[#869b8b]">
                {item.is_demo ? '[Demonstration Record]' : '[Live User Listing]'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* =========================================================================
   2. RESOURCE ADVISOR SECTION
   ========================================================================= */
function AdvisorSection({
  onAddResource,
  go,
}: {
  onAddResource: (res: Resource) => void
  go: (v: View) => void
}) {
  const [name, setName] = useState('Paddy straw')
  const [category, setCategory] = useState('Crop residue')
  const [quantity, setQuantity] = useState('240')
  const [unit, setUnit] = useState('kg')
  const [condition, setCondition] = useState('Dry and clean')
  const [intendedUse, setIntendedUse] = useState('Mushroom substrate')
  const [location, setLocation] = useState('Nashik, Maharashtra')
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [hasGenerated, setHasGenerated] = useState(false)
  const [confirmedSafety, setConfirmedSafety] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoName(file.name)
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    }
  }

  const handleGenerate = () => {
    if (!name.trim()) {
      setFormError('Please enter a material name.')
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      setFormError('Please enter a valid quantity greater than 0.')
      return
    }
    if (!location.trim()) {
      setFormError('Please specify the location or village.')
      return
    }
    setFormError(null)
    setHasGenerated(true)
  }

  const suggestion = useMemo(
    () => getAdvisorSuggestions(name, category, condition, intendedUse),
    [name, category, condition, intendedUse]
  )

  const handleConfirmAndList = () => {
    if (!confirmedSafety) {
      alert('Please check the confirmation box verifying that you have reviewed the precautions.')
      return
    }

    const newResource: Resource = {
      id: `res-${Date.now().toString().slice(-5)}`,
      material_name: name.trim(),
      category,
      quantity: Number(quantity),
      unit,
      condition,
      location: location.trim(),
      intended_use: intendedUse,
      status: 'available',
      created_at: new Date().toISOString(),
      photo_name: photoName || undefined,
      photo_preview: photoPreview || undefined,
      is_demo: false,
    }

    onAddResource(newResource)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Rule-Assisted Advisory"
        title="AI Resource Advisor"
        description="Describe any agricultural residue to discover verified next-use potential, scientific suitability factors, and mandatory precautions. Suggestions are an advisory starting point—not a laboratory certification."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        {/* Form Container */}
        <section className="rounded-2xl border border-[#e2e8df] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f1e7] text-[#2b7047]">
              <Sprout size={20} />
            </div>
            <div>
              <h2 className="font-bold text-[#23442f]">Material Details</h2>
              <p className="text-xs text-[#8a9b8e]">Step 1 of 2: Detail your agricultural residue</p>
            </div>
          </div>

          {formError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertTriangle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            {/* Photo Selection */}
            <div>
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b9ccb9] bg-[#f7faf6] p-4 text-center hover:bg-[#edf5ec]">
                <Upload size={18} className="text-[#5e8968]" />
                <span className="mt-1.5 text-xs font-semibold text-[#477151]">
                  {photoName ? `Selected: ${photoName}` : 'Select material photo (Optional)'}
                </span>
                <span className="mt-0.5 text-[10px] text-[#91a297]">
                  JPG or PNG · Visual reference only (Does not replace chemical/fungal testing)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                />
              </label>

              {photoPreview && (
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#d6e5d5] bg-[#fcfdfa] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="size-12 rounded object-cover border"
                  />
                  <div className="text-[11px] text-[#55735b]">
                    <p className="font-semibold">{photoName}</p>
                    <p className="text-[10px] text-[#819985]">
                      Visual preview attached for field reference only.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Inputs */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#536d5b]">
              Material name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paddy straw, Sugarcane trash, Coconut husk"
                className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3.5 py-2.5 text-sm font-normal text-[#294632] outline-none focus:border-[#6f9d79] focus:ring-2 focus:ring-[#dcebdc]"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#536d5b]">
                Approximate quantity
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 240"
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3.5 py-2.5 text-sm font-normal text-[#294632] outline-none focus:border-[#6f9d79] focus:ring-2 focus:ring-[#dcebdc]"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#536d5b]">
                Unit
                <div className="relative">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3.5 py-2.5 text-sm font-normal text-[#294632] outline-none focus:border-[#6f9d79]"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="tonnes">tonnes (Metric)</option>
                    <option value="bundles">bundles</option>
                    <option value="bags">bags</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-3.5 text-[#79927e]"
                  />
                </div>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#536d5b]">
                Material category
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3.5 py-2.5 text-sm font-normal text-[#294632] outline-none focus:border-[#6f9d79]"
                  >
                    <option>Crop residue</option>
                    <option>Organic matter</option>
                    <option>Horticultural residue</option>
                    <option>Composting material</option>
                    <option>Animal bedding</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-3.5 text-[#79927e]"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#536d5b]">
                Current condition
                <div className="relative">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3.5 py-2.5 text-sm font-normal text-[#294632] outline-none focus:border-[#6f9d79]"
                  >
                    <option>Dry and baled</option>
                    <option>Dry and clean</option>
                    <option>Moist / unseparated</option>
                    <option>Clean and washed</option>
                    <option>Mixed / needs sorting</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-3.5 text-[#79927e]"
                  />
                </div>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#536d5b]">
                Possible intended use
                <div className="relative">
                  <select
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3.5 py-2.5 text-sm font-normal text-[#294632] outline-none focus:border-[#6f9d79]"
                  >
                    <option>Mushroom substrate</option>
                    <option>Compost carbon layer</option>
                    <option>Mulch or coir</option>
                    <option>Animal bedding</option>
                    <option>Composting & mulch</option>
                    <option>Not sure yet</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-3.5 text-[#79927e]"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#536d5b]">
                Location / Village
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nashik, Maharashtra"
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3.5 py-2.5 text-sm font-normal text-[#294632] outline-none focus:border-[#6f9d79]"
                />
              </label>
            </div>

            <button
              onClick={handleGenerate}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#245c3a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#19472c]"
            >
              <Sparkles size={16} /> Generate rule-based recommendations
            </button>
          </div>
        </section>

        {/* Suggestion Output Container */}
        <section className="flex flex-col justify-between rounded-2xl border border-[#e2e8df] bg-[#eef5eb] p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <Badge tone="dark">Transparent Agricultural Guidance</Badge>
              <span className="text-[10px] font-semibold text-[#66826c]">Curated Advisory Rules</span>
            </div>

            {hasGenerated ? (
              <div className="mt-5 flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#284b34]">
                    {suggestion.detected_name} · Suitability Profile
                  </h2>
                  <p className="mt-0.5 text-xs text-[#5f7a65]">
                    Category: <span className="font-semibold">{suggestion.primary_category}</span> · Condition: {condition}
                  </p>
                </div>

                {/* 4 Cards of Curated Rules */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#d9e7d7] bg-white/90 p-4 shadow-xs">
                    <p className="text-xs font-bold text-[#2d6b42]">Potential Next Uses</p>
                    <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[#556e5a]">
                      {suggestion.potential_uses.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-[#d9e7d7] bg-white/90 p-4 shadow-xs">
                    <p className="text-xs font-bold text-[#2d6b42]">Scientific & Practical Fit</p>
                    <p className="mt-2 text-xs leading-5 text-[#556e5a]">{suggestion.fit_rationale}</p>
                  </div>

                  <div className="rounded-xl border border-[#ead8c4] bg-[#fdf9f2] p-4 shadow-xs">
                    <p className="text-xs font-bold text-[#8c6031]">Information Still Needed</p>
                    <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[#725a39]">
                      {suggestion.information_needed.map((info, i) => (
                        <li key={i}>{info}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-[#ebd2d2] bg-[#fef7f7] p-4 shadow-xs">
                    <p className="text-xs font-bold text-[#9e3535]">Precautions & Safety Gaps</p>
                    <ul className="mt-2 list-disc pl-4 text-xs leading-5 text-[#863737]">
                      {suggestion.precautions.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Mandatory Confirmation */}
                <label className="flex items-start gap-3 rounded-xl border border-[#c6d9c7] bg-white p-4 text-xs font-medium text-[#46634e]">
                  <input
                    type="checkbox"
                    checked={confirmedSafety}
                    onChange={(e) => setConfirmedSafety(e.target.checked)}
                    className="mt-0.5 size-4 accent-[#245c3a]"
                  />
                  <span>
                    I confirm these material details and understand that automated suggestions do not replace field or agricultural safety checks.
                  </span>
                </label>

                {/* Confirm & List Button */}
                <button
                  onClick={handleConfirmAndList}
                  disabled={!confirmedSafety}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    confirmedSafety
                      ? 'bg-[#245c3a] text-white shadow-sm hover:bg-[#1a472c]'
                      : 'cursor-not-allowed border border-[#d2dfd0] bg-[#e4ede2] text-[#8ea492]'
                  }`}
                >
                  <PackageCheck size={16} /> Confirm & List on MittiBank
                </button>
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <div className="rounded-2xl bg-white/70 p-4 text-[#76a17b]">
                  <Sprout size={32} />
                </div>
                <h2 className="mt-4 font-bold text-[#31533b]">Your Recommendation Will Appear Here</h2>
                <p className="mt-2 max-w-sm text-xs leading-5 text-[#85998a]">
                  Enter your residue details and click &quot;Generate rule-based recommendations&quot; to inspect practical applications, moisture factors, and necessary precautions.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-[#d1dfcf] bg-white/70 p-3.5 text-xs text-[#627764]">
            <strong className="text-[#2b5936]">Scientific & Safety Standard:</strong> Advisory suggestions are calculated strictly using curated agricultural rule-bases. Image uploads are for identification reference only and never establish chemical or microbiological safety.
          </div>
        </section>
      </div>
    </div>
  )
}

/* =========================================================================
   3. MITTIBANK EXCHANGE SECTION
   ========================================================================= */
function ExchangeSection({
  resources,
  go,
}: {
  resources: Resource[]
  go: (v: View) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available_only'>('available_only')

  const filtered = useMemo(() => {
    return resources.filter((item) => {
      const matchQuery =
        item.material_name.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase()) ||
        item.intended_use.toLowerCase().includes(query.toLowerCase())

      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory

      const matchStatus = statusFilter === 'all' || item.status === 'available'

      return matchQuery && matchCategory && matchStatus
    })
  }, [resources, query, selectedCategory, statusFilter])

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <PageHeading
          eyebrow="Community Resource Network"
          title="MittiBank Exchange"
          description="Browse and share agricultural materials with nearby growers and bio-processors. Prevent residues from burning while keeping bio-nutrients in the soil loop."
        />
        <button
          onClick={() => go('advisor')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#245c3a] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#19472c]"
        >
          <FilePlus2 size={16} /> List a new resource
        </button>
      </section>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8df] bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-[#91a297]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search material, location, or intended use..."
            className="w-full rounded-xl border border-[#dce6da] py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-[#6f9d79]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2.5 text-xs font-semibold text-[#42644c] outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Crop residue">Crop residue</option>
            <option value="Organic matter">Organic matter</option>
            <option value="Horticultural residue">Horticultural residue</option>
            <option value="Animal bedding">Animal bedding</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available_only')}
            className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2.5 text-xs font-semibold text-[#42644c] outline-none"
          >
            <option value="available_only">Available Only</option>
            <option value="all">All Statuses (Including Exchanged)</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#ccd9ca] bg-white p-8 text-center">
          <PackageCheck size={32} className="text-[#81a687]" />
          <h3 className="mt-3 font-bold text-[#2a4d33]">No Resources Found</h3>
          <p className="mt-1 text-xs text-[#7b9180]">
            Try adjusting your search query or change status filter to include all records.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-[#e2e8df] bg-white p-5 shadow-xs transition hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eef5eb] text-[#4d8158]">
                    <Leaf size={20} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      tone={
                        item.status === 'available'
                          ? 'sage'
                          : item.status === 'matched'
                          ? 'gold'
                          : 'brown'
                      }
                    >
                      {item.status === 'available'
                        ? 'Available'
                        : item.status === 'matched'
                        ? 'Matched'
                        : 'Collected / Reused'}
                    </Badge>
                    <span className="text-[10px] text-[#93a697]">ID: {item.id}</span>
                  </div>
                </div>

                <h2 className="mt-4 font-bold text-[#284b34]">{item.material_name}</h2>
                <p className="text-xs text-[#79907f]">{item.category} · {item.condition}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#edf1ec] py-3 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-[#9aa99c]">Quantity</p>
                    <p className="mt-0.5 font-bold text-[#355d3f]">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-[#9aa99c]">Intended Use</p>
                    <p className="mt-0.5 font-bold text-[#355d3f] truncate">{item.intended_use}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#718575]">
                  <p className="flex items-center gap-1">
                    <MapPin size={13} className="text-[#849f87]" /> {item.location}
                  </p>
                  <span className="text-[10px] text-[#9aada0]">
                    {item.is_demo ? '[Demo]' : '[Live]'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button
                  onClick={() => go('matches')}
                  className="w-full rounded-xl bg-[#245c3a] py-2.5 text-xs font-semibold text-white transition hover:bg-[#19472c]"
                >
                  Find Smart Matches
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   4. SMART MATCHES SECTION
   ========================================================================= */
function MatchesSection({
  matches,
  onInitiateExchange,
  go,
}: {
  matches: MatchResult[]
  onInitiateExchange: (match: MatchResult) => void
  go: (v: View) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Suitability-First Matching"
        title="Smart Matches"
        description="Connect available residues with verified farmer and processor requests. Agricultural suitability rules exclude incompatible or contaminated materials before match scoring."
      />

      <div className="rounded-2xl border border-[#eadfc5] bg-[#fffaf0] p-4 text-xs leading-5 text-[#765e32]">
        <CircleHelp size={16} className="mr-2 inline text-[#b58b45]" />
        <strong>Transparent Matching Factors:</strong> Eligible matches are ranked by Intended Use Alignment (40%), Quantity Proximity (30%), Distance Proximity (20%), and Condition (10%). Match scores never replace physical quality confirmation.
      </div>

      {matches.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#ccd9ca] bg-white p-8 text-center">
          <Users size={32} className="text-[#81a687]" />
          <h3 className="mt-3 font-bold text-[#2a4d33]">No Matches Currently Available</h3>
          <p className="mt-1 text-xs text-[#7b9180]">
            All available resources may already be matched, or material requirements need broader parameters.
          </p>
          <button
            onClick={() => go('advisor')}
            className="mt-4 rounded-xl bg-[#245c3a] px-4 py-2 text-xs font-semibold text-white"
          >
            List a new material
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((item, index) => (
            <div
              key={`${item.resource.id}-${item.request.id}`}
              className="rounded-2xl border border-[#e2e8df] bg-white p-5 shadow-xs transition hover:shadow-md"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Match Details */}
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1e7] text-[#3e7650]">
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-[#284b34]">{item.resource.material_name}</h2>
                      <ArrowRight size={14} className="text-[#89a48d]" />
                      <span className="font-bold text-[#3d6547]">{item.request.requester_name}</span>
                      <Badge tone={item.score >= 85 ? 'sage' : 'gold'}>{item.status_badge}</Badge>
                    </div>

                    <p className="mt-1 text-xs text-[#6e8574]">
                      Available: <strong className="text-[#2b5435]">{item.resource.quantity} {item.resource.unit}</strong> · Intended for:{' '}
                      <strong className="text-[#2b5435]">{item.request.intended_use}</strong>
                    </p>

                    <div className="mt-2.5 rounded-lg bg-[#f6f9f5] p-2 text-[11px] text-[#556e5a]">
                      <strong className="text-[#285736]">Why it matched:</strong> {item.reason}
                    </div>
                  </div>
                </div>

                {/* Score and Stats */}
                <div className="flex items-center justify-between gap-6 border-t border-[#edf1ec] pt-4 lg:border-t-0 lg:pt-0">
                  <div className="grid grid-cols-3 gap-5 text-left lg:text-right">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[#9aa99c]">Compatibility</p>
                      <p className="mt-0.5 text-base font-bold text-[#2d7047]">{item.score}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[#9aa99c]">Distance</p>
                      <p className="mt-0.5 text-xs font-bold text-[#42644c]">{item.distance_str}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-[#9aa99c]">Est. Transport</p>
                      <p className="mt-0.5 text-xs font-bold text-[#42644c]">{item.transport_cost_str}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onInitiateExchange(item)}
                    className="rounded-xl bg-[#245c3a] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#19472c]"
                  >
                    Initiate Exchange
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   5. COST CALCULATOR SECTION
   ========================================================================= */
function CalculatorSection({
  onSaveEstimate,
}: {
  onSaveEstimate: (est: CostEstimate) => void
}) {
  const [title, setTitle] = useState('Paddy straw mushroom substrate scenario')

  const [external, setExternal] = useState({
    material: 12000,
    transport: 2400,
    processing: 800,
    other: 0,
  })

  const [local, setLocal] = useState({
    material: 1800,
    transport: 900,
    processing: 1200,
    labour: 1100,
    other: 0,
  })

  // Mandatory formula:
  // External total = material + transport + processing + other
  // Local total = material acquisition + transport + processing + labour + other
  // Estimated savings = external total - local total
  const extTotal = useMemo(() => {
    return Object.values(external).reduce((a, b) => a + (Number(b) || 0), 0)
  }, [external])

  const locTotal = useMemo(() => {
    return Object.values(local).reduce((a, b) => a + (Number(b) || 0), 0)
  }, [local])

  const savings = extTotal - locTotal

  const handleSave = () => {
    const estimate: CostEstimate = {
      id: `est-${Date.now().toString().slice(-5)}`,
      title: title.trim() || 'Custom BioLoop Cost Comparison',
      external_total: extTotal,
      local_total: locTotal,
      estimated_savings: savings,
      created_at: new Date().toISOString(),
    }
    onSaveEstimate(estimate)
  }

  const loadPreset = (preset: 'paddy' | 'leaves' | 'husk') => {
    if (preset === 'paddy') {
      setTitle('Paddy straw mushroom substrate (1 tonne equivalent)')
      setExternal({ material: 12000, transport: 2400, processing: 800, other: 0 })
      setLocal({ material: 1800, transport: 900, processing: 1200, labour: 1100, other: 0 })
    } else if (preset === 'leaves') {
      setTitle('Dry leaves municipal compost carbon supplement')
      setExternal({ material: 6000, transport: 1800, processing: 500, other: 0 })
      setLocal({ material: 600, transport: 400, processing: 700, labour: 800, other: 0 })
    } else {
      setTitle('Coconut coir nursery potting medium replacement')
      setExternal({ material: 14500, transport: 2900, processing: 1200, other: 400 })
      setLocal({ material: 2500, transport: 1100, processing: 1500, labour: 1400, other: 200 })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <PageHeading
          eyebrow="Financial Feasibility Model"
          title="Cost Calculator"
          description="Compare commercial external purchase costs against local agro-loop reuse. Validates all expenses transparently. Negative results are fully supported."
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5a7460]">Load scenario:</span>
          <button
            onClick={() => loadPreset('paddy')}
            className="rounded-lg border border-[#d2dfd0] bg-white px-2.5 py-1 text-xs font-medium text-[#2d6239] hover:bg-[#edf5ec]"
          >
            Paddy Straw
          </button>
          <button
            onClick={() => loadPreset('leaves')}
            className="rounded-lg border border-[#d2dfd0] bg-white px-2.5 py-1 text-xs font-medium text-[#2d6239] hover:bg-[#edf5ec]"
          >
            Leaf Litter
          </button>
          <button
            onClick={() => loadPreset('husk')}
            className="rounded-lg border border-[#d2dfd0] bg-white px-2.5 py-1 text-xs font-medium text-[#2d6239] hover:bg-[#edf5ec]"
          >
            Coconut Coir
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {/* External Purchase Panel */}
          <section className="rounded-2xl border border-[#e2e8df] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#284b34]">External Purchase</h2>
              <Badge tone="brown">Commercial Sourcing</Badge>
            </div>
            <p className="mt-1 text-xs text-[#7e9483]">What would it cost to procure commercial material?</p>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Material cost (₹)
                <input
                  type="number"
                  min="0"
                  value={external.material}
                  onChange={(e) => setExternal({ ...external, material: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Transportation cost (₹)
                <input
                  type="number"
                  min="0"
                  value={external.transport}
                  onChange={(e) => setExternal({ ...external, transport: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Processing / Preparation (₹)
                <input
                  type="number"
                  min="0"
                  value={external.processing}
                  onChange={(e) => setExternal({ ...external, processing: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Other external expenses (₹)
                <input
                  type="number"
                  min="0"
                  value={external.other}
                  onChange={(e) => setExternal({ ...external, other: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>
            </div>

            <div className="mt-4 border-t border-[#edf1ec] pt-3 flex justify-between items-center text-xs">
              <span className="font-semibold text-[#667e6b]">External Total:</span>
              <span className="font-bold text-[#22442c] text-sm">₹{extTotal.toLocaleString('en-IN')}</span>
            </div>
          </section>

          {/* Local Reuse Panel */}
          <section className="rounded-2xl border border-[#e2e8df] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#284b34]">Local BioLoop Reuse</h2>
              <Badge tone="sage">Community Loop</Badge>
            </div>
            <p className="mt-1 text-xs text-[#7e9483]">What are the true local handling & labor costs?</p>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Local acquisition cost (₹)
                <input
                  type="number"
                  min="0"
                  value={local.material}
                  onChange={(e) => setLocal({ ...local, material: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Local transportation (₹)
                <input
                  type="number"
                  min="0"
                  value={local.transport}
                  onChange={(e) => setLocal({ ...local, transport: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Local processing / shredding (₹)
                <input
                  type="number"
                  min="0"
                  value={local.processing}
                  onChange={(e) => setLocal({ ...local, processing: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Labour cost (₹)
                <input
                  type="number"
                  min="0"
                  value={local.labour}
                  onChange={(e) => setLocal({ ...local, labour: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#536d5b]">
                Other local expenses (₹)
                <input
                  type="number"
                  min="0"
                  value={local.other}
                  onChange={(e) => setLocal({ ...local, other: Math.max(0, Number(e.target.value)) })}
                  className="rounded-xl border border-[#dce6da] bg-[#fcfdfb] px-3 py-2 text-sm text-[#294632] outline-none"
                />
              </label>
            </div>

            <div className="mt-4 border-t border-[#edf1ec] pt-3 flex justify-between items-center text-xs">
              <span className="font-semibold text-[#667e6b]">Local Total:</span>
              <span className="font-bold text-[#22442c] text-sm">₹{locTotal.toLocaleString('en-IN')}</span>
            </div>
          </section>
        </div>

        {/* Calculation Result Summary */}
        <section className="flex flex-col justify-between rounded-2xl bg-[#245c3a] p-6 text-white shadow-md">
          <div>
            <Badge tone="sage">Transparent Formula</Badge>
            <h2 className="mt-4 text-xl font-bold">Estimated Cost Comparison</h2>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#c9dfcd]">External Total:</span>
                <span className="font-bold">₹{extTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#c9dfcd]">Local Total:</span>
                <span className="font-bold">₹{locTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="my-5 border-t border-white/20" />

            <p className="text-xs text-[#c9dfcd]">
              Formula: <strong className="text-white">Savings = External Total − Local Total</strong>
            </p>

            <p
              className={`mt-2 text-3xl font-extrabold ${
                savings < 0 ? 'text-[#f6c88f]' : 'text-[#d7f0d3]'
              }`}
            >
              {savings < 0 ? '-' : ''}₹{Math.abs(savings).toLocaleString('en-IN')}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#d7e8d8]">
              {savings >= 0
                ? 'Local BioLoop reuse yields a positive financial advantage over external procurement.'
                : 'Local reuse appears more expensive with these parameters (e.g. high manual labour or transport).'}
            </p>

            <div className="mt-4 rounded-xl bg-white/10 p-3 text-[11px] leading-4 text-[#c3dec7]">
              All calculation variables represent user inputs. Savings are not guaranteed and depend on local freight, moisture weight loss, and labor availability.
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15">
            <button
              onClick={handleSave}
              className="w-full rounded-xl bg-[#d5efb9] py-3 text-xs font-bold text-[#1f4a2d] transition hover:bg-white"
            >
              Save Estimate to Impact Dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

/* =========================================================================
   6. IMPACT TRACKER SECTION
   ========================================================================= */
function ImpactSection({
  stats,
  exchanges,
  resources,
  onRecordCollection,
  onConfirmReuse,
  go,
}: {
  stats: {
    listedKg: number
    collectedKg: number
    reusedKg: number
    matchedKg: number
    savings: number
    completedExchanges: number
    activeListingsCount: number
  }
  exchanges: Exchange[]
  resources: Resource[]
  onRecordCollection: (id: string, qty: number) => void
  onConfirmReuse: (id: string, qty: number) => void
  go: (v: View) => void
}) {
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>(null)
  const [inputQty, setInputQty] = useState<number>(0)
  const [modalMode, setModalMode] = useState<'collect' | 'confirm' | null>(null)

  const openActionModal = (exc: Exchange, mode: 'collect' | 'confirm') => {
    setSelectedExchangeId(exc.id)
    setModalMode(mode)
    setInputQty(mode === 'collect' ? exc.quantity : exc.quantity_collected || exc.quantity)
  }

  const submitAction = () => {
    if (!selectedExchangeId || inputQty <= 0) return

    if (modalMode === 'collect') {
      onRecordCollection(selectedExchangeId, inputQty)
    } else if (modalMode === 'confirm') {
      onConfirmReuse(selectedExchangeId, inputQty)
    }
    setModalMode(null)
    setSelectedExchangeId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Evidence Over Assumptions"
        title="Impact Tracker"
        description="Verify the physical movement of agricultural residues through distinct stages. A resource is never counted as collected until physical transfer is confirmed, and never counted as reused without recipient verification."
      />

      {/* 6 Key Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Material listed"
          value={`${stats.listedKg.toLocaleString('en-IN')} kg`}
          detail={`${resources.length} active listings recorded`}
          icon={PackageCheck}
        />
        <StatCard
          label="Material matched"
          value={`${stats.matchedKg.toLocaleString('en-IN')} kg`}
          detail={`${exchanges.length} suitability checks completed`}
          icon={Users}
        />
        <StatCard
          label="Material collected"
          value={`${stats.collectedKg.toLocaleString('en-IN')} kg`}
          detail="Physical collection verified"
          icon={Truck}
        />
        <StatCard
          label="Confirmed as reused"
          value={`${stats.reusedKg.toLocaleString('en-IN')} kg`}
          detail="Confirmed by receiving farm/facility"
          icon={Check}
        />
        <StatCard
          label="Completed exchanges"
          value={`${stats.completedExchanges}`}
          detail="Closed end-to-end loops"
          icon={Recycle}
        />
        <StatCard
          label="Estimated cash savings"
          value={`₹${stats.savings.toLocaleString('en-IN')}`}
          detail="Based on verified cost estimates"
          icon={Coins}
        />
      </div>

      {/* Verification Notice */}
      <div className="rounded-2xl border border-[#eadcc6] bg-[#fbf7ed] p-4 text-xs leading-5 text-[#826e53]">
        <Info size={16} className="mr-2 inline text-[#a17849]" />
        <strong>Standard of Truth:</strong> AgriVicta BioLoop AI explicitly separates <em>Listed</em>, <em>Matched</em>, <em>Collected</em>, and <em>Confirmed Reused</em> quantities. We do not generate unverified carbon offset credits or unsupported soil nitrogen claims without official laboratory documentation.
      </div>

      {/* Active Exchanges Lifecycle Management */}
      <section className="rounded-2xl border border-[#e2e8df] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#284b34]">Active Exchange Lifecycle Records</h2>
            <p className="mt-1 text-xs text-[#8a9b8e]">
              Manage the physical progression of agreed resource transfers
            </p>
          </div>
          <button
            onClick={() => go('matches')}
            className="text-xs font-bold text-[#2d7047] hover:underline"
          >
            Find more matches →
          </button>
        </div>

        {exchanges.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#d2dfd0] p-6 text-center text-xs text-[#7d9181]">
            No exchanges recorded yet. Initiate an exchange from Smart Matches to begin tracking.
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {exchanges.map((exc) => (
              <div
                key={exc.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-[#e8efe6] bg-[#fcfdfa] p-4 md:flex-row md:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#20442c]">{exc.resource_name}</span>
                    <ArrowRight size={13} className="text-[#89a48d]" />
                    <span className="font-semibold text-[#3b6045]">{exc.requester_name}</span>
                    <Badge
                      tone={
                        exc.status === 'confirmed_reused'
                          ? 'sage'
                          : exc.status === 'collected'
                          ? 'blue'
                          : 'gold'
                      }
                    >
                      {exc.status === 'confirmed_reused'
                        ? 'Confirmed Reused'
                        : exc.status === 'collected'
                        ? 'Collected (Awaiting Reuse)'
                        : 'Matched (Pending Collection)'}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-[#718575]">
                    Agreed Qty: <strong className="text-[#2b5435]">{exc.quantity} {exc.unit}</strong> · Collected:{' '}
                    <strong className="text-[#2b5435]">{exc.quantity_collected} {exc.unit}</strong> · Reused:{' '}
                    <strong className="text-[#2b5435]">{exc.quantity_reused} {exc.unit}</strong>
                  </p>

                  {exc.notes && <p className="mt-1 text-[11px] text-[#869b8b]">{exc.notes}</p>}
                </div>

                {/* Lifecycle Step Actions */}
                <div className="flex items-center gap-2">
                  {exc.status === 'matched' && (
                    <button
                      onClick={() => openActionModal(exc, 'collect')}
                      className="rounded-xl bg-[#245c3a] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#18482b]"
                    >
                      Record Collection
                    </button>
                  )}

                  {exc.status === 'collected' && (
                    <button
                      onClick={() => openActionModal(exc, 'confirm')}
                      className="rounded-xl bg-[#2e6d42] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#205230]"
                    >
                      Confirm Final Reuse
                    </button>
                  )}

                  {exc.status === 'confirmed_reused' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f6f43]">
                      <Check size={14} /> Loop Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal for Recording Collection or Confirming Reuse */}
      {modalMode && selectedExchangeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#d8e5d5] bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#1f442c]">
              {modalMode === 'collect' ? 'Record Physical Material Collection' : 'Confirm Agricultural Reuse'}
            </h3>
            <p className="mt-1.5 text-xs text-[#6e8574]">
              {modalMode === 'collect'
                ? 'Enter verified quantity collected from supplier farm.'
                : 'Enter confirmed quantity applied to soil, compost heap, or mushroom beds.'}
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-[#48634f]">
                Quantity ({exchanges.find((e) => e.id === selectedExchangeId)?.unit ?? 'kg'})
                <input
                  type="number"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(Math.max(1, Number(e.target.value)))}
                  className="mt-1.5 w-full rounded-xl border border-[#dce6da] px-3.5 py-2 text-sm text-[#294632] outline-none"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalMode(null)
                  setSelectedExchangeId(null)
                }}
                className="rounded-xl border border-[#dce6da] px-4 py-2 text-xs font-semibold text-[#546d5a] hover:bg-[#f6f9f5]"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                className="rounded-xl bg-[#245c3a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#18462a]"
              >
                Submit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
