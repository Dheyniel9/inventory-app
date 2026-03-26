export function InventoryHeader() {
  return (
    <header className="mb-4">
      <p className="inline-block rounded-full border border-emerald-300/60 bg-emerald-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
        Stock Control Center
      </p>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
        Inventory Dashboard
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
        Track products, stock movement, and estimated inventory value in one place.
      </p>
    </header>
  )
}
