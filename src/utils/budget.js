export function calcPhaseProgress(phase) {
  const items = phase.items || []
  const total = items.length
  const done = items.filter(i => i.status === 'concluido').length
  const inProgress = items.filter(i => i.status === 'em_andamento').length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  const totalValue = items.reduce((s, i) => s + (i.contractValue || 0), 0)
  const paidValue = items.reduce((s, i) => s + (i.paidValue || 0), 0)
  return { total, done, inProgress, percent, totalValue, paidValue }
}

export function calcOverallBudget(budget) {
  const phases = Object.values(budget?.phases || {})
  const committed = phases.reduce((s, p) => s + (p.committed || 0), 0)
  const paid = phases.reduce((s, p) => s + (p.paid || 0), 0)
  const planned = phases.reduce((s, p) => s + (p.planned || 0), 0)
  const remaining = (budget?.total || 0) - committed
  return { total: budget?.total || 0, committed, paid, planned, remaining }
}
