'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AddProductForm } from '../components/inventory/AddProductForm'
import { InventoryHeader } from '../components/inventory/InventoryHeader'
import { InventoryList } from '../components/inventory/InventoryList'
import { PosCheckout } from '../components/inventory/PosCheckout'
import { PosProductPicker } from '../components/inventory/PosProductPicker'
import { StatsOverview } from '../components/inventory/StatsOverview'
import { TransactionHistoryTable } from '../components/inventory/TransactionHistoryTable'
import { supabase } from '../lib/supabaseClient'
import { Product, TransactionHistoryItem } from '../types/inventory'

export default function Home() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cashGiven, setCashGiven] = useState('')
  const [posMessage, setPosMessage] = useState('')
  const [isCompletingSale, setIsCompletingSale] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([])

  // Fetch products
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

  const deleteProduct = async (id: number) => {
    setDeletingId(id)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (!error) {
      const data = await fetchProducts()
      setProducts(data)
      setMessage('Product deleted.')
    } else {
      if (error.code === '23503') {
        setMessage('Cannot delete product with recorded transactions. Update FK to ON DELETE SET NULL if you want to allow deletion.')
      } else {
        setMessage('Failed to delete product.')
      }
    }
    setDeletingId(null)
  }

  const addToCart = (product: Product) => {
    setPosMessage('')
    setCart((currentCart) => {
      const currentQty = currentCart[product.id] ?? 0
      return {
        ...currentCart,
        [product.id]: currentQty + 1,
      }
    })
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

  // Fetch products only on the client after initial render.
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setIsLoadingHistory(true)

      const [productData, transactionData] = await Promise.all([
        fetchProducts(),
        fetchTransactionHistory(),
      ])

      setProducts(productData)
      setTransactionHistory(transactionData)
      setIsLoading(false)
      setIsLoadingHistory(false)
    }

    void loadData()
  }, [])

  // Add product
  const addProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const parsedPrice = parseFloat(price)

    if (!name.trim() || Number.isNaN(parsedPrice)) {
      setMessage('Please provide a valid name and price.')
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from('products').insert([
      { name: name.trim(), price: parsedPrice }
    ])

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Product added.')
      setName('')
      setPrice('')
      const data = await fetchProducts()
      setProducts(data)
    }

    setIsSubmitting(false)
  }

  const totalProducts = products.length
  const averagePrice =
    totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0
  const catalogValue = products.reduce((sum, p) => sum + p.price, 0)

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

    setPosMessage(`Sale completed. Change: ${formatCurrency(change)}`)
    setCart({})
    setCashGiven('')

    const latestTransactions = await fetchTransactionHistory()
    setTransactionHistory(latestTransactions)

    setIsCompletingSale(false)
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value)

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-100 via-emerald-50/30 to-amber-50 px-2 py-5 sm:px-3 lg:px-4">
      <div className="pointer-events-none absolute -right-10 -top-12 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />

      <section className="animate-fadeIn relative z-10 w-full">
        <InventoryHeader />

        <StatsOverview
          totalProducts={totalProducts}
          averagePrice={formatCurrency(averagePrice)}
          catalogValue={formatCurrency(catalogValue)}
        />

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,430px)_minmax(420px,1fr)]">
          <AddProductForm
            name={name}
            price={price}
            isSubmitting={isSubmitting}
            message={message}
            onNameChange={setName}
            onPriceChange={setPrice}
            onSubmit={addProduct}
          />

          <InventoryList
            products={products}
            isLoading={isLoading}
            deletingId={deletingId}
            formatCurrency={formatCurrency}
            onDelete={(id) => {
              void deleteProduct(id)
            }}
          />
        </section>

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
