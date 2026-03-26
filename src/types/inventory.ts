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
