export type Product = {
  id: number
  name: string
  price: number
}

export type CartItem = Product & {
  quantity: number
  lineTotal: number
}

export type TransactionHistoryItem = {
  id: number
  created_at: string
  total_amount: number
  cash_given: number
  change_amount: number
  total_items: number
  line_count: number
}

export type GCashEntry = {
  id: number
  session_id: number
  type: 'cash_in' | 'cash_out'
  amount: number
  reference_id: string | null
  description: string | null
  created_at: string
}
