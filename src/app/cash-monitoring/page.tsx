'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AppNavigation } from '../../components/inventory/AppNavigation'
import { InventoryHeader } from '../../components/inventory/InventoryHeader'
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient'

type CashSession = {
  id: number
  date: string
  starting_cash: number
  expected_cash: number
  actual_cash: number | null
  discrepancy: number | null
}

type SaleItem = {
  id: number
  session_id: number
  amount: number
  description: string | null
  created_at: string
}

type ExpenseItem = {
  id: number
  session_id: number
  amount: number
  reason: string
  created_at: string
}

const DEFAULT_STARTING_CASH = 10000

const getTodayDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value)

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function CashMonitoringPage() {
  const [sessionDate] = useState(getTodayDateString())
  const [startingCashInput, setStartingCashInput] = useState(String(DEFAULT_STARTING_CASH))
  const [actualCashInput, setActualCashInput] = useState('')
  const [salesAmountInput, setSalesAmountInput] = useState('')
  const [salesDescriptionInput, setSalesDescriptionInput] = useState('')
  const [expenseAmountInput, setExpenseAmountInput] = useState('')
  const [expenseReasonInput, setExpenseReasonInput] = useState('')
  const [session, setSession] = useState<CashSession | null>(null)
  const [sales, setSales] = useState<SaleItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startingCash = Number.parseFloat(startingCashInput)
  const parsedActualCash = Number.parseFloat(actualCashInput)
  const totalSales = useMemo(() => sales.reduce((sum, item) => sum + item.amount, 0), [sales])
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  )

  const expectedCash =
    Number.isFinite(startingCash) && startingCash >= 0
      ? startingCash + totalSales - totalExpenses
      : totalSales - totalExpenses

  const hasActualCash = Number.isFinite(parsedActualCash) && parsedActualCash >= 0
  const discrepancy = hasActualCash ? parsedActualCash - expectedCash : null

  const discrepancyStatus =
    discrepancy === null
      ? 'Pending'
      : discrepancy === 0
        ? 'Balanced'
        : discrepancy < 0
          ? 'Short'
          : 'Over'

  const loadSessionData = async (cashSession: CashSession) => {
    if (!supabase) return

    const [salesResponse, expensesResponse] = await Promise.all([
      supabase
        .from('sales')
        .select('*')
        .eq('session_id', cashSession.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('*')
        .eq('session_id', cashSession.id)
        .order('created_at', { ascending: false }),
    ])

    if (salesResponse.error || expensesResponse.error) {
      setMessage('Unable to load transactions for this session.')
      return
    }

    setSales((salesResponse.data ?? []) as SaleItem[])
    setExpenses((expensesResponse.data ?? []) as ExpenseItem[])
  }

  const fetchTodaySession = async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const { data, error } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('date', sessionDate)
      .order('id', { ascending: false })
      .limit(1)

    if (error) {
      setMessage('Failed to load today session.')
      setIsLoading(false)
      return
    }

    const currentSession = (data?.[0] ?? null) as CashSession | null

    if (!currentSession) {
      setSession(null)
      setSales([])
      setExpenses([])
      setIsLoading(false)
      return
    }

    setSession(currentSession)
    setStartingCashInput(String(currentSession.starting_cash))
    setActualCashInput(currentSession.actual_cash !== null ? String(currentSession.actual_cash) : '')
    await loadSessionData(currentSession)
    setIsLoading(false)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void fetchTodaySession()
  }, [])

  const startSession = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')

    if (!supabase) {
      setMessage('Supabase is not configured. Please set environment variables first.')
      return
    }

    if (session) {
      setMessage('A cash session for today already exists.')
      return
    }

    const parsedStartingCash = Number.parseFloat(startingCashInput)

    if (!Number.isFinite(parsedStartingCash) || parsedStartingCash < 0) {
      setMessage('Starting cash must be a number greater than or equal to 0.')
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('cash_sessions')
      .insert([
        {
          date: sessionDate,
          starting_cash: parsedStartingCash,
          expected_cash: parsedStartingCash,
          actual_cash: null,
          discrepancy: null,
        },
      ])
      .select('*')
      .single()

    if (error || !data) {
      setMessage('Unable to start a session. Please try again.')
      setIsSubmitting(false)
      return
    }

    const createdSession = data as CashSession
    setSession(createdSession)
    setSales([])
    setExpenses([])
    setMessage('Session started successfully.')
    setIsSubmitting(false)
  }

  const addSale = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')

    if (!supabase || !session) {
      setMessage('Start a session before adding sales.')
      return
    }

    const amount = Number.parseFloat(salesAmountInput)
    const description = salesDescriptionInput.trim()

    if (!Number.isFinite(amount) || amount < 0) {
      setMessage('Sale amount must be a number greater than or equal to 0.')
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('sales')
      .insert([
        {
          session_id: session.id,
          amount,
          description: description || null,
        },
      ])
      .select('*')
      .single()

    if (error || !data) {
      setMessage('Unable to add sale entry.')
      setIsSubmitting(false)
      return
    }

    setSales((current) => [data as SaleItem, ...current])
    setSalesAmountInput('')
    setSalesDescriptionInput('')
    setMessage('Sale entry added.')
    setIsSubmitting(false)
  }

  const addExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')

    if (!supabase || !session) {
      setMessage('Start a session before adding expenses.')
      return
    }

    const amount = Number.parseFloat(expenseAmountInput)
    const reason = expenseReasonInput.trim()

    if (!Number.isFinite(amount) || amount < 0) {
      setMessage('Expense amount must be a number greater than or equal to 0.')
      return
    }

    if (!reason) {
      setMessage('Expense reason is required.')
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          session_id: session.id,
          amount,
          reason,
        },
      ])
      .select('*')
      .single()

    if (error || !data) {
      setMessage('Unable to add expense entry.')
      setIsSubmitting(false)
      return
    }

    setExpenses((current) => [data as ExpenseItem, ...current])
    setExpenseAmountInput('')
    setExpenseReasonInput('')
    setMessage('Expense entry added.')
    setIsSubmitting(false)
  }

  const endDay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')

    if (!supabase || !session) {
      setMessage('Start a session first.')
      return
    }

    if (!hasActualCash) {
      setMessage('Actual cash must be a number greater than or equal to 0.')
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('cash_sessions')
      .update({
        expected_cash: expectedCash,
        actual_cash: parsedActualCash,
        discrepancy,
      })
      .eq('id', session.id)
      .select('*')
      .single()

    if (error || !data) {
      setMessage('Unable to save end-of-day record.')
      setIsSubmitting(false)
      return
    }

    setSession(data as CashSession)
    setMessage(`End-of-day recorded. Status: ${discrepancyStatus}.`)
    setIsSubmitting(false)
  }

  const displayMessage =
    !isSupabaseConfigured
      ? 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      : message

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-100 via-emerald-50/30 to-amber-50 px-3 py-6 sm:px-4 sm:py-7 lg:px-6">
      <div className="pointer-events-none absolute -right-10 -top-12 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />

      <section className="animate-fadeIn relative z-10 w-full">
        <InventoryHeader />
        <AppNavigation />

        <header className="mb-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <h1 className="text-xl font-bold text-emerald-900 sm:text-2xl">Daily Cash Monitoring</h1>
          <p className="mt-1 text-sm text-emerald-700">Session Date: {sessionDate}</p>
          {displayMessage ? (
            <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {displayMessage}
            </p>
          ) : null}
        </header>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Start Session</h2>
            <form className="mt-3 space-y-3" onSubmit={startSession}>
              <label className="block text-sm font-medium text-emerald-900">
                Starting Cash
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={startingCashInput}
                  onChange={(event) => setStartingCashInput(event.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={Boolean(session) || isSubmitting || isLoading || !isSupabaseConfigured}
                className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {session ? 'Session Active' : 'Start Session'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm text-emerald-900">
              <div className="flex items-center justify-between">
                <dt>Starting Cash</dt>
                <dd className="font-semibold">{formatCurrency(Number.isFinite(startingCash) ? startingCash : 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Total Sales</dt>
                <dd className="font-semibold text-emerald-700">{formatCurrency(totalSales)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Total Expenses</dt>
                <dd className="font-semibold text-rose-700">{formatCurrency(totalExpenses)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-100 pt-2 text-base">
                <dt className="font-semibold">Expected Cash</dt>
                <dd className="font-bold text-emerald-900">{formatCurrency(expectedCash)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Sales List</h2>
            <form className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(120px,160px)_1fr_auto]" onSubmit={addSale}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={salesAmountInput}
                onChange={(event) => setSalesAmountInput(event.target.value)}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={salesDescriptionInput}
                onChange={(event) => setSalesDescriptionInput(event.target.value)}
              />
              <button
                type="submit"
                disabled={!session || isSubmitting || !isSupabaseConfigured}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Add Sale
              </button>
            </form>

            <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1">
              {sales.length === 0 ? (
                <li className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm text-emerald-700">
                  No sales entries yet.
                </li>
              ) : (
                sales.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-emerald-900">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-emerald-700">{formatDateTime(item.created_at)}</span>
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-xs text-emerald-800">{item.description}</p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Expenses List</h2>
            <form
              className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(120px,160px)_1fr_auto]"
              onSubmit={addExpense}
            >
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={expenseAmountInput}
                onChange={(event) => setExpenseAmountInput(event.target.value)}
              />
              <input
                type="text"
                placeholder="Reason"
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                value={expenseReasonInput}
                onChange={(event) => setExpenseReasonInput(event.target.value)}
              />
              <button
                type="submit"
                disabled={!session || isSubmitting || !isSupabaseConfigured}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                Add Expense
              </button>
            </form>

            <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1">
              {expenses.length === 0 ? (
                <li className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm text-emerald-700">
                  No expense entries yet.
                </li>
              ) : (
                expenses.map((item) => (
                  <li key={item.id} className="rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-rose-800">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-rose-700">{formatDateTime(item.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs text-rose-800">{item.reason}</p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm xl:col-span-2">
            <h2 className="text-lg font-semibold text-emerald-900">End of Day</h2>
            <form className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr_auto]" onSubmit={endDay}>
              <label className="text-sm font-medium text-emerald-900">
                Actual Cash Count
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={actualCashInput}
                  onChange={(event) => setActualCashInput(event.target.value)}
                />
              </label>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900">
                <p>
                  Expected Cash: <span className="font-semibold">{formatCurrency(expectedCash)}</span>
                </p>
                <p>
                  Discrepancy:{' '}
                  <span className="font-semibold">
                    {discrepancy === null ? 'Pending' : formatCurrency(discrepancy)}
                  </span>
                </p>
                <p>
                  Status: <span className="font-semibold">{discrepancyStatus}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={!session || isSubmitting || !isSupabaseConfigured}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                Save End of Day
              </button>
            </form>
          </section>
        </section>
      </section>
    </main>
  )
}
