import { Product } from '../../types/inventory'

type InventoryListProps = {
  products: Product[]
  isLoading: boolean
  deletingId: number | null
  editingId: number | null
  formatCurrency: (value: number) => string
  onDelete: (id: number) => void
  onEdit: (product: Product) => void
}

export function InventoryList({
  products,
  isLoading,
  deletingId,
  editingId,
  formatCurrency,
  onDelete,
  onEdit,
}: InventoryListProps) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Inventory List</h2>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          {products.length} items
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading inventory...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-slate-600">No products yet. Add your first item to get started.</p>
      ) : (
        <div className="grid gap-2" role="list">
          {products.map((product) => (
            <div
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              role="listitem"
              key={product.id}
            >
              <div>
                <p className="text-base font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-600">{formatCurrency(product.price)}</p>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  className="w-full rounded-lg bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-20 sm:w-auto"
                  onClick={() => onEdit(product)}
                  disabled={deletingId === product.id}
                >
                  {editingId === product.id ? 'Editing' : 'Edit'}
                </button>

                <button
                  className="w-full rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-20 sm:w-auto"
                  onClick={() => onDelete(product.id)}
                  disabled={deletingId === product.id}
                >
                  {deletingId === product.id ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
