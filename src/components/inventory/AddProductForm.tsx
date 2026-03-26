import { FormEvent } from 'react'

type AddProductFormProps = {
  name: string
  price: string
  isSubmitting: boolean
  message: string
  onNameChange: (value: string) => void
  onPriceChange: (value: string) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

export function AddProductForm({
  name,
  price,
  isSubmitting,
  message,
  onNameChange,
  onPriceChange,
  onSubmit,
}: AddProductFormProps) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Add Product</h2>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          Live insert
        </span>
      </div>

      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Product name
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200"
            type="text"
            placeholder="Chips.."
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Unit price
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200"
            type="number"
            placeholder="49.99"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            required
          />
        </label>

        <button
          className="rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:from-emerald-800 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Product'}
        </button>
      </form>

      {message && <p className="mt-3 text-sm font-medium text-sky-800">{message}</p>}
    </article>
  )
}
