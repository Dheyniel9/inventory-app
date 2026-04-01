'use client'

import { FormEvent } from 'react'

type AddGCashEntryFormProps = {
  type: 'cash_in' | 'cash_out'
  amount: string
  referenceId: string
  description: string
  isSubmitting: boolean
  message: string
  title?: string
  submitLabel?: string
  isEditing?: boolean
  onTypeChange: (value: 'cash_in' | 'cash_out') => void
  onAmountChange: (value: string) => void
  onReferenceIdChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onCancel?: () => void
}

export function AddGCashEntryForm({
  type,
  amount,
  referenceId,
  description,
  isSubmitting,
  message,
  title = 'Add GCash Entry',
  submitLabel = 'Add Entry',
  isEditing = false,
  onTypeChange,
  onAmountChange,
  onReferenceIdChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
}: AddGCashEntryFormProps) {
  return (
    <article className="rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          {isEditing ? 'Live update' : 'Live insert'}
        </span>
      </div>

      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Transaction Type
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
            value={type}
            onChange={(e) => onTypeChange(e.target.value as 'cash_in' | 'cash_out')}
            required
          >
            <option value="cash_in">Cash In (Received Money)</option>
            <option value="cash_out">Cash Out (Give Money)</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Amount
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
            type="number"
            placeholder="1000.00"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Reference ID (Optional)
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
            type="text"
            placeholder="GCash transaction ID or reference"
            value={referenceId}
            onChange={(e) => onReferenceIdChange(e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Description (Optional)
          <textarea
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-200"
            placeholder="Enter description..."
            rows={2}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </label>

        {message && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {message}
          </p>
        )}

        <button
          className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:from-amber-700 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : submitLabel}
        </button>

        {isEditing && onCancel && (
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </form>
    </article>
  )
}
