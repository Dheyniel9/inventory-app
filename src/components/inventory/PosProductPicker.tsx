import { Product } from '../../types/inventory'

type PosProductPickerProps = {
  products: Product[]
  cart: Record<number, number>
  formatCurrency: (value: number) => string
  onAddToCart: (product: Product) => void
}

export function PosProductPicker({
  products,
  cart,
  formatCurrency,
  onAddToCart,
}: PosProductPickerProps) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">POS Product Picker</h2>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Click to add
        </span>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-slate-600">Add products to inventory first before creating a sale.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const selectedQty = cart[product.id] ?? 0

            return (
              <button
                type="button"
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-600">Price: {formatCurrency(product.price)}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">Selected: {selectedQty}</p>
              </button>
            )
          })}
        </div>
      )}
    </article>
  )
}
