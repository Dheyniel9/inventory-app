'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppNavigation() {
  const pathname = usePathname()

  const baseClass =
    'rounded-xl px-4 py-2 text-sm font-semibold transition border'

  const tabClass = (isActive: boolean) =>
    isActive
      ? `${baseClass} border-emerald-700 bg-emerald-700 text-white`
      : `${baseClass} border-emerald-200 bg-white/80 text-emerald-800 hover:bg-emerald-50`

  return (
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="Inventory sections">
      <Link href="/products" className={tabClass(pathname === '/products')}>
        Products
      </Link>
      <Link href="/pos" className={tabClass(pathname === '/pos')}>
        POS + Transactions
      </Link>
    </nav>
  )
}
