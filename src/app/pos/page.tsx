'use client'

import { useEffect, useState } from 'react'
import { AppNavigation } from '../../components/inventory/AppNavigation'
import { InventoryHeader } from '../../components/inventory/InventoryHeader'
import { PosCheckout } from '../../components/inventory/PosCheckout'
import { PosProductPicker } from '../../components/inventory/PosProductPicker'
import { TransactionHistoryTable } from '../../components/inventory/TransactionHistoryTable'
import { supabase } from '../../lib/supabaseClient'
import { Product, TransactionHistoryItem } from '../../types/inventory'

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cashGiven, setCashGiven] = useState('')
  const [posMessage, setPosMessage] = useState('')
  const [isCompletingSale, setIsCompletingSale] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([])

  const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*')
    if (!error && data) return data as Product[]
    return []
  }

  const fetchTransactionHistory = async (): Promise<TransactionHistoryItem[]> => {
    const { data, error } = await supabase
      .from('transaction_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) return data as TransactionHistoryItem[]
    return []
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingHistory(true)
      const [productData, transactionData] = await Promise.all([
        fetchProducts(),
        fetchTransactionHistory(),
      ])

      setProducts(productData)
      setTransactionHistory(transactionData)
      setIsLoadingHistory(false)
    }

    void loadData()
  }, [])

  const addToCart = (product: Product) => {
    setPosMessage('')
    setCart((currentCart) => ({
      ...currentCart,
      [product.id]: (currentCart[product.id] ?? 0) + 1,
    }))
  }

  const decreaseCartItem = (productId: number) => {
    setPosMessage('')
    setCart((currentCart) => {
      const currentQty = currentCart[productId] ?? 0
      if (currentQty <= 1) {
        const nextCart = { ...currentCart }
        delete nextCart[productId]
        return nextCart
      }

      return {
        ...currentCart,
        [productId]: currentQty - 1,
      }
    })
  }

  const clearSale = () => {
    setCart({})
    setCashGiven('')
    setPosMessage('')
  }

  const cartItems = products
    .map((product) => {
      const quantity = cart[product.id] ?? 0
      return {
        ...product,
        quantity,
        lineTotal: quantity * product.price,
      }
    })
    .filter((item) => item.quantity > 0)

  const saleTotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const parsedCash = Number.parseFloat(cashGiven)
  const hasValidCash = !Number.isNaN(parsedCash) && parsedCash >= 0
  const change = hasValidCash ? parsedCash - saleTotal : 0
  const insufficientCash = cartItems.length > 0 && hasValidCash && change < 0

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(value)

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const completeSale = async () => {
    if (cartItems.length === 0) {
      setPosMessage('Add at least one product to start a sale.')
      return
    }

    if (!hasValidCash) {
      setPosMessage('Enter a valid cash amount.')
      return
    }

    if (change < 0) {
      setPosMessage('Insufficient payment. Please collect enough cash.')
      return
    }

    setIsCompletingSale(true)

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([
        {
          total_amount: saleTotal,
          cash_given: parsedCash,
          change_amount: change,
        },
      ])
      .select('id')
      .single()

    if (transactionError || !transaction) {
      setPosMessage('Failed to save transaction. Please try again.')
      setIsCompletingSale(false)
      return
    }

    const itemsPayload = cartItems.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.id,
      product_name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      line_total: item.lineTotal,
    }))

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsPayload)

    if (itemsError) {
      setPosMessage('Transaction saved but failed to save line items.')
      setIsCompletingSale(false)
      return
    }

    const latestTransactions = await fetchTransactionHistory()
    setTransactionHistory(latestTransactions)

    setPosMessage(`Sale completed. Change: ${formatCurrency(change)}`)
    setCart({})
    setCashGiven('')
    setIsCompletingSale(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-100 via-emerald-50/30 to-amber-50 px-2 py-5 sm:px-3 lg:px-4">
      <div className="pointer-events-none absolute -right-10 -top-12 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />

      <section className="animate-fadeIn relative z-10 w-full">
        <InventoryHeader />
        <AppNavigation />

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PosProductPicker
            products={products}
            cart={cart}
            formatCurrency={formatCurrency}
            onAddToCart={addToCart}
          />

          <PosCheckout
            cartItems={cartItems}
            saleTotal={saleTotal}
            cashGiven={cashGiven}
            hasValidCash={hasValidCash}
            change={change}
            insufficientCash={insufficientCash}
            isCompletingSale={isCompletingSale}
            posMessage={posMessage}
            formatCurrency={formatCurrency}
            onDecreaseCartItem={decreaseCartItem}
            onClearSale={clearSale}
            onCashChange={(value) => {
              setCashGiven(value)
              setPosMessage('')
            }}
            onCompleteSale={() => {
              void completeSale()
            }}
          />
        </section>

        <TransactionHistoryTable
          isLoadingHistory={isLoadingHistory}
          transactionHistory={transactionHistory}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
      </section>
    </main>
  )
}
