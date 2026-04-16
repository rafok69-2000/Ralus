import { useMemo } from 'react'

export function useCardFilters(columns, filters) {
  return useMemo(() => {
    if (!filters.active) return columns

    return columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => {
        // Filtro por etiqueta
        if (filters.labelId) {
          const hasLabel = card.labels?.some(l => l.id === filters.labelId)
          if (!hasLabel) return false
        }

        // Filtro por fecha límite y estado
        if (filters.dueDateStatus) {
          if (!card.dueDate) return false
          const now = new Date()
          const due = new Date(card.dueDate)
          const diffHours = (due - now) / (1000 * 60 * 60)

          if (filters.dueDateStatus === 'overdue'  && diffHours >= 0) return false
          if (filters.dueDateStatus === 'soon'     && (diffHours < 0 || diffHours > 48)) return false
          if (filters.dueDateStatus === 'ok'       && diffHours <= 48) return false
        }

        return true
      })
    }))
  }, [columns, filters])
}
