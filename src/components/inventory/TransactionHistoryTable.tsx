import { TransactionHistoryItem } from '../../types/inventory'

type TransactionHistoryTableProps = {
  isLoadingHistory: boolean
  transactionHistory: TransactionHistoryItem[]
  formatDate: (value: string) => string
  formatCurrency: (value: number) => string
}

export function TransactionHistoryTable({
  isLoadingHistory,
  transactionHistory,
  formatDate,
  formatCurrency,
}: TransactionHistoryTableProps) {
  return (
    <section className="mt-4 rounded-2xl border border-emerald-100 bg-white/85 p-4 shadow-lg shadow-slate-300/30 backdrop-blur-sm">
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
          Last 20 sales
        </span>
      </div>

      {isLoadingHistory ? (
        <p className="text-sm text-slate-600">Loading transaction history...</p>
      ) : transactionHistory.length === 0 ? (
        <p className="text-sm text-slate-600">No completed sales yet.</p>
      ) : (
        <>
          <div className="grid gap-3 md:hidden" role="list" aria-label="Recent transactions">
            {transactionHistory.map((transaction) => (
              <article key={transaction.id} className="rounded-xl border border-slate-200 bg-white p-3" role="listitem">
                <p className="text-sm font-semibold text-slate-900">{formatDate(transaction.created_at)}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <p>Items: {transaction.total_items}</p>
                  <p>Lines: {transaction.line_count}</p>
                  <p>Total: {formatCurrency(transaction.total_amount)}</p>
                  <p>Cash: {formatCurrency(transaction.cash_given)}</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Change: {formatCurrency(transaction.change_amount)}
                </p>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Items</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Lines</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Total</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Cash</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Change</th>
                </tr>
              </thead>
              <tbody>
                {transactionHistory.map((transaction) => (
                  <tr key={transaction.id} className="rounded-xl bg-white">
                    <td className="rounded-l-xl border-y border-l border-slate-200 px-3 py-2 text-slate-700">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="border-y border-slate-200 px-3 py-2 text-slate-700">{transaction.total_items}</td>
                    <td className="border-y border-slate-200 px-3 py-2 text-slate-700">{transaction.line_count}</td>
                    <td className="border-y border-slate-200 px-3 py-2 font-semibold text-slate-900">
                      {formatCurrency(transaction.total_amount)}
                    </td>
                    <td className="border-y border-slate-200 px-3 py-2 text-slate-700">
                      {formatCurrency(transaction.cash_given)}
                    </td>
                    <td className="rounded-r-xl border-y border-r border-slate-200 px-3 py-2 text-emerald-700">
                      {formatCurrency(transaction.change_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
