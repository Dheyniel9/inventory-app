type StatsOverviewProps = {
  totalProducts: number
  averagePrice: string
  catalogValue: string
}

export function StatsOverview({ totalProducts, averagePrice, catalogValue }: StatsOverviewProps) {
  return (
    <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Inventory overview">
      <article className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total SKUs</p>
        <strong className="mt-2 block text-2xl font-bold text-slate-900">{totalProducts}</strong>
      </article>
      <article className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Average Price</p>
        <strong className="mt-2 block text-2xl font-bold text-slate-900">{averagePrice}</strong>
      </article>
      <article className="rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Catalog Value</p>
        <strong className="mt-2 block text-2xl font-bold text-slate-900">{catalogValue}</strong>
      </article>
    </section>
  )
}
