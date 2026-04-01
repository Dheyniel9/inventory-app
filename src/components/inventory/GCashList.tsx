'use client'

import { GCashEntry } from '../../types/inventory'

type GCashListProps = {
  entries: GCashEntry[]
  isLoading: boolean
  deletingId: number | null
  editingId: number | null
  formatCurrency: (value: number) => string
  onDelete: (id: number) => void
  onEdit: (entry: GCashEntry) => void
}

export function GCashList({
  entries,
  isLoading,
  deletingId,
  editingId,
  formatCurrency,
  onDelete,
  onEdit,
}: GCashListProps) {
  const totalCashIn = entries
    .filter((e) => e.type === 'cash_in')
    .reduce((sum, e) => sum + e.amount, 0)

  const totalCashOut = entries
    .filter((e) => e.type === 'cash_out')
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <article className="rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">GCash Entries</h2>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          {entries.length} entries
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading GCash entries...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-600">No GCash entries yet. Add your first entry to get started.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-600">Cash In</p>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalCashIn)}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs text-rose-600">Cash Out</p>
              <p className="text-lg font-bold text-rose-700">{formatCurrency(totalCashOut)}</p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="text-xs text-sky-600">Net</p>
              <p className={`text-lg font-bold ${totalCashIn - totalCashOut >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(totalCashIn - totalCashOut)}
              </p>
            </div>
          </div>

          <div className="grid gap-2" role="list">
            {entries.map((entry) => {
              const isIn = entry.type === 'cash_in'
              return (
                <div
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  role="listitem"
                  key={entry.id}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 rounded-lg px-3 py-1 text-xs font-semibold ${
                        isIn
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isIn ? 'Cash In' : 'Cash Out'}
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${isIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isIn ? '+' : '-'} {formatCurrency(entry.amount)}
                      </p>
                      {entry.description && (
                        <p className="text-sm text-slate-600">{entry.description}</p>
                      )}
                      {entry.reference_id && (
                        <p className="text-xs text-slate-500">Ref: {entry.reference_id}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <button
                      className="w-full rounded-lg bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-20 sm:w-auto"
                      onClick={() => onEdit(entry)}
                      disabled={deletingId === entry.id}
                    >
                      {editingId === entry.id ? 'Editing' : 'Edit'}
                    </button>

                    <button
                      className="w-full rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-20 sm:w-auto"
                      onClick={() => onDelete(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? 'Removing...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </article>
  )
}
