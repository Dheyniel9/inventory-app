'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AddProductForm } from '../../components/inventory/AddProductForm'
import { AppNavigation } from '../../components/inventory/AppNavigation'
import { InventoryHeader } from '../../components/inventory/InventoryHeader'
import { InventoryList } from '../../components/inventory/InventoryList'
import { StatsOverview } from '../../components/inventory/StatsOverview'
import { supabase } from '../../lib/supabaseClient'
import { Product } from '../../types/inventory'

export default function ProductsPage() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*')
    if (!error && data) return data as Product[]
    return []
  }

  const loadProducts = async () => {
    setIsLoading(true)
    const data = await fetchProducts()
    setProducts(data)
    setIsLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    void fetchProducts().then((data) => {
      if (!isMounted) return
      setProducts(data)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

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
      { name: name.trim(), price: parsedPrice },
    ])

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Product added.')
      setName('')
      setPrice('')
      await loadProducts()
    }

    setIsSubmitting(false)
  }

  const deleteProduct = async (id: number) => {
    setDeletingId(id)
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (!error) {
      setMessage('Product deleted.')
      await loadProducts()
    } else if (error.code === '23503') {
      setMessage('Cannot delete product with recorded transactions.')
    } else {
      setMessage('Failed to delete product.')
    }

    setDeletingId(null)
  }

  const totalProducts = products.length
  const averagePrice =
    totalProducts > 0 ? products.reduce((sum, p) => sum + p.price, 0) / totalProducts : 0
  const catalogValue = products.reduce((sum, p) => sum + p.price, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(value)

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-100 via-emerald-50/30 to-amber-50 px-2 py-5 sm:px-3 lg:px-4">
      <div className="pointer-events-none absolute -right-10 -top-12 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />

      <section className="animate-fadeIn relative z-10 w-full">
        <InventoryHeader />
        <AppNavigation />

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
      </section>
    </main>
  )
}
