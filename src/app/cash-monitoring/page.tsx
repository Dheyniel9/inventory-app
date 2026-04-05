'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { AddGCashEntryForm } from '../../components/inventory/AddGCashEntryForm'
import { AppNavigation } from '../../components/inventory/AppNavigation'
import { GCashList } from '../../components/inventory/GCashList'
import { InventoryHeader } from '../../components/inventory/InventoryHeader'
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient'
import { GCashEntry } from '../../types/inventory'

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

const roundMoney = (value: number) => {
  const rounded = Math.round(value * 100) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}

export default function CashMonitoringPage() {
  const [sessionDate] = useState(getTodayDateString())
  const [startingCashInput, setStartingCashInput] = useState(String(DEFAULT_STARTING_CASH))
  const [actualCashInput, setActualCashInput] = useState('')
  const [salesAmountInput, setSalesAmountInput] = useState('')
  const [salesDescriptionInput, setSalesDescriptionInput] = useState('')
  const [expenseAmountInput, setExpenseAmountInput] = useState('')
  const [expenseReasonInput, setExpenseReasonInput] = useState('')
  const [gcashType, setGcashType] = useState<'cash_in' | 'cash_out'>('cash_in')
  const [gcashAmount, setGcashAmount] = useState('')
  const [gcashReferenceId, setGcashReferenceId] = useState('')
  const [gcashDescription, setGcashDescription] = useState('')
  const [session, setSession] = useState<CashSession | null>(null)
  const [sales, setSales] = useState<SaleItem[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [gcashEntries, setGcashEntries] = useState<GCashEntry[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const startingCash = Number.parseFloat(startingCashInput)
  const parsedActualCash = Number.parseFloat(actualCashInput)
  const totalCashSales = useMemo(() => sales.reduce((sum, item) => sum + item.amount, 0), [sales])
  const totalCashExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  )
  const totalGCashCashIn = useMemo(
    () => gcashEntries.filter((entry) => entry.type === 'cash_in').reduce((sum, entry) => sum + entry.amount, 0),
    [gcashEntries],
  )
  const totalGCashCashOut = useMemo(
    () => gcashEntries.filter((entry) => entry.type === 'cash_out').reduce((sum, entry) => sum + entry.amount, 0),
    [gcashEntries],
  )

  // Physical drawer cash formula:
  // Expected Cash = Starting Cash + Total Cash Sales + Total GCash Cash-In - Total Cash Expenses - Total GCash Cash-Out
  const expectedCash = roundMoney(
    Number.isFinite(startingCash) && startingCash >= 0
      ? startingCash + totalCashSales + totalGCashCashIn - totalCashExpenses - totalGCashCashOut
      : totalCashSales + totalGCashCashIn - totalCashExpenses - totalGCashCashOut,
  )

  const hasActualCash = Number.isFinite(parsedActualCash) && parsedActualCash >= 0
  const discrepancy = hasActualCash ? roundMoney(parsedActualCash - expectedCash) : null

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

    const [salesResponse, expensesResponse, gcashResponse] = await Promise.all([
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
      supabase
        .from('gcash_entries')
        .select('*')
        .eq('session_id', cashSession.id)
        .order('created_at', { ascending: false }),
    ])

    if (salesResponse.error || expensesResponse.error || gcashResponse.error) {
      setMessage('Unable to load transactions for this session.')
      return
    }

    setSales((salesResponse.data ?? []) as SaleItem[])
    setExpenses((expensesResponse.data ?? []) as ExpenseItem[])
    setGcashEntries((gcashResponse.data ?? []) as GCashEntry[])
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

  const addGCashEntry = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')

    if (!supabase || !session) {
      setMessage('Start a session before adding GCash entries.')
      return
    }

    const amount = Number.parseFloat(gcashAmount)
    const refId = gcashReferenceId.trim()
    const desc = gcashDescription.trim()

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('GCash amount must be a number greater than 0.')
      return
    }

    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('gcash_entries')
      .insert([
        {
          session_id: session.id,
          type: gcashType,
          amount,
          reference_id: refId || null,
          description: desc || null,
        },
      ])
      .select('*')
      .single()

    if (error || !data) {
      setMessage('Unable to add GCash entry.')
      setIsSubmitting(false)
      return
    }

    setGcashEntries((current) => [data as GCashEntry, ...current])
    setGcashAmount('')
    setGcashReferenceId('')
    setGcashDescription('')
    setMessage('GCash entry added.')
    setIsSubmitting(false)
  }

  const deleteGCashEntry = async (id: number) => {
    if (!supabase) return

    setDeletingId(id)
    setMessage('')

    const { error } = await supabase
      .from('gcash_entries')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage('Unable to delete GCash entry.')
      setDeletingId(null)
      return
    }

    setGcashEntries((current) => current.filter((item) => item.id !== id))
    setMessage('GCash entry deleted.')
    setDeletingId(null)
  }

  const editGCashEntry = (entry: GCashEntry) => {
    setEditingId(entry.id)
    setGcashType(entry.type)
    setGcashAmount(String(entry.amount))
    setGcashReferenceId(entry.reference_id || '')
    setGcashDescription(entry.description || '')
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
        actual_cash: roundMoney(parsedActualCash),
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
    <main className="min-h-screen bg-slate-50 px-3 py-4 lg:px-4">
      <section className="w-full">
        <InventoryHeader />
        <AppNavigation />

        <header className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Cash Monitoring</h1>
          <p className="mt-1 text-sm text-slate-600">Session Date: {sessionDate}</p>
          {displayMessage ? (
            <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {displayMessage}
            </p>
          ) : null}
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">Start Session</h2>
            <form className="mt-3 space-y-3" onSubmit={startSession}>
              <label className="block text-sm font-medium text-slate-700">
                Starting Cash
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  value={startingCashInput}
                  onChange={(event) => setStartingCashInput(event.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={Boolean(session) || isSubmitting || isLoading || !isSupabaseConfigured}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {session ? 'Session Active' : 'Start Session'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <dt>Starting Cash</dt>
                <dd className="font-semibold">{formatCurrency(Number.isFinite(startingCash) ? startingCash : 0)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Total Cash Sales</dt>
                <dd className="font-semibold text-emerald-700">{formatCurrency(totalCashSales)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>GCash Cash In</dt>
                <dd className="font-semibold text-emerald-700">{formatCurrency(totalGCashCashIn)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>GCash Cash Out</dt>
                <dd className="font-semibold text-rose-700">{formatCurrency(totalGCashCashOut)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Total Cash Expenses</dt>
                <dd className="font-semibold text-rose-600">{formatCurrency(totalCashExpenses)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
                <dt className="font-semibold">Expected Cash</dt>
                <dd className="font-bold text-slate-900">{formatCurrency(expectedCash)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Actual Cash</dt>
                <dd className="font-semibold">
                  {hasActualCash ? formatCurrency(parsedActualCash) : 'Pending'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Discrepancy</dt>
                <dd className="font-semibold">
                  {discrepancy === null ? 'Pending' : formatCurrency(discrepancy)} ({discrepancyStatus})
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">Cash Sales</h2>
            <form className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(120px,160px)_1fr_auto]" onSubmit={addSale}>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                value={salesAmountInput}
                onChange={(event) => setSalesAmountInput(event.target.value)}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                value={salesDescriptionInput}
                onChange={(event) => setSalesDescriptionInput(event.target.value)}
              />
              <button
                type="submit"
                disabled={!session || isSubmitting || !isSupabaseConfigured}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Add Cash Sale
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
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-slate-500">{formatDateTime(item.created_at)}</span>
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
            <form
              className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(120px,160px)_1fr_auto]"
              onSubmit={addExpense}
            >
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                value={expenseAmountInput}
                onChange={(event) => setExpenseAmountInput(event.target.value)}
              />
              <input
                type="text"
                placeholder="Reason"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                value={expenseReasonInput}
                onChange={(event) => setExpenseReasonInput(event.target.value)}
              />
              <button
                type="submit"
                disabled={!session || isSubmitting || !isSupabaseConfigured}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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
                  <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-slate-500">{formatDateTime(item.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.reason}</p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <AddGCashEntryForm
            type={gcashType}
            amount={gcashAmount}
            referenceId={gcashReferenceId}
            description={gcashDescription}
            isSubmitting={isSubmitting}
            message=""
            submitLabel={editingId ? 'Update Entry' : 'Add Entry'}
            isEditing={editingId !== null}
            onTypeChange={setGcashType}
            onAmountChange={setGcashAmount}
            onReferenceIdChange={setGcashReferenceId}
            onDescriptionChange={setGcashDescription}
            onSubmit={addGCashEntry}
            onCancel={
              editingId
                ? () => {
                    setEditingId(null)
                    setGcashAmount('')
                    setGcashReferenceId('')
                    setGcashDescription('')
                  }
                : undefined
            }
          />

          <GCashList
            entries={gcashEntries}
            isLoading={isLoading}
            deletingId={deletingId}
            editingId={editingId}
            formatCurrency={formatCurrency}
            onDelete={deleteGCashEntry}
            onEdit={editGCashEntry}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">End of Day</h2>
            <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto]" onSubmit={endDay}>
              <label className="text-sm font-medium text-slate-700">
                Actual Cash Count
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  value={actualCashInput}
                  onChange={(event) => setActualCashInput(event.target.value)}
                />
              </label>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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
