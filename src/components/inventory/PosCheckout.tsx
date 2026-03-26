import { CartItem } from '../../types/inventory'

type PosCheckoutProps = {
  cartItems: CartItem[]
  saleTotal: number
  cashGiven: string
  hasValidCash: boolean
  change: number
  insufficientCash: boolean
  isCompletingSale: boolean
  posMessage: string
  formatCurrency: (value: number) => string
  onDecreaseCartItem: (productId: number) => void
  onClearSale: () => void
  onCashChange: (value: string) => void
  onCompleteSale: () => void
}

export function PosCheckout({
  cartItems,
  saleTotal,
  cashGiven,
  hasValidCash,
  change,
  insufficientCash,
  isCompletingSale,
  posMessage,
  formatCurrency,
  onDecreaseCartItem,
  onClearSale,
  onCashChange,
  onCompleteSale,
}: PosCheckoutProps) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">POS Checkout</h2>
        <button
          type="button"
          onClick={onClearSale}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Clear Sale
        </button>
      </div>

      {cartItems.length === 0 ? (
        <p className="text-sm text-slate-600">No items selected yet.</p>
      ) : (
        <div className="mb-4 grid gap-2">
          {cartItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm font-semibold text-slate-800">{formatCurrency(item.lineTotal)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
                <span>
                  {item.quantity} x {formatCurrency(item.price)}
                </span>
                <button
                  type="button"
                  onClick={() => onDecreaseCartItem(item.id)}
                  className="rounded-md bg-rose-100 px-2 py-1 font-semibold text-rose-700 transition hover:bg-rose-200"
                >
                  Remove 1
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Amount</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(saleTotal)}</p>
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Money Given
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={cashGiven}
            onChange={(e) => onCashChange(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200"
          />
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Change</p>
          <p className={`text-xl font-bold ${insufficientCash ? 'text-rose-700' : 'text-emerald-700'}`}>
            {hasValidCash ? formatCurrency(change) : formatCurrency(0)}
          </p>
        </div>

        <button
          type="button"
          onClick={onCompleteSale}
          disabled={isCompletingSale}
          className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:from-amber-700 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCompletingSale ? 'Saving Sale...' : 'Complete Sale'}
        </button>

        {posMessage && <p className="text-sm font-medium text-sky-800">{posMessage}</p>}
      </div>
    </article>
  )
}
