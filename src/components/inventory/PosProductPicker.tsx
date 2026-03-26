import { useMemo, useState } from 'react'
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
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProducts = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    if (!normalizedTerm) return products

    return products.filter((product) => product.name.toLowerCase().includes(normalizedTerm))
  }, [products, searchTerm])

  return (
    <article className="w-full rounded-2xl border border-emerald-100 bg-white/85 p-2 shadow-lg shadow-slate-300/30 backdrop-blur-sm sm:p-4">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">POS Product Picker</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Click to add
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200 sm:w-56"
            aria-label="Search products"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-slate-600">Add products to inventory first before creating a sale.</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-sm text-slate-600">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-6 ">
          {filteredProducts.map((product) => {
            const selectedQty = cart[product.id] ?? 0

            return (
              <button
                type="button"
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 sm:p-4"
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
