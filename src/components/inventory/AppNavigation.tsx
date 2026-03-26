'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppNavigation() {
  const pathname = usePathname()

  const baseClass =
    'w-full rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition sm:w-auto'

  const tabClass = (isActive: boolean) =>
    isActive
      ? `${baseClass} border-emerald-700 bg-emerald-700 text-white`
      : `${baseClass} border-emerald-200 bg-white/80 text-emerald-800 hover:bg-emerald-50`

  return (
    <nav className="mb-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap" aria-label="Inventory sections">
      <Link href="/products" className={tabClass(pathname === '/products')}>
        Products
      </Link>
      <Link href="/pos" className={tabClass(pathname === '/pos')}>
        POS + Transactions
      </Link>
    </nav>
  )
}
