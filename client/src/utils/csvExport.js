export function exportOrdersToCSV(orders) {
  const headers = [
    'Order ID', 'Date', 'Buyer Name', 'Phone', 'Email',
    'Items', 'Amount (INR)', 'Status', 'AWB Code', 'Courier', 'Tracking URL',
  ]

  const rows = orders.map((o) => {
    const itemNames = (o.items || []).map(i => i.name || i.productName).filter(Boolean).join(' | ')
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : ''
    return [
      o._id || '',
      date,
      o.customer?.name || '',
      o.customer?.phone || '',
      o.customer?.email || '',
      itemNames || o.productName || '',
      o.totalAmount || o.salePrice || 0,
      o.status || '',
      o.shipment?.awbCode || '',
      o.shipment?.courierName || '',
      o.shipment?.trackingUrl || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  const csv = [headers.map(h => `"${h}"`), ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
