import { useEffect, useRef } from 'react'
import { useState } from 'react'

const DUE_DATE_OPTIONS = [
  { value: null,      label: 'Todas',      icon: null,  colorClass: 'text-gray-600' },
  { value: 'overdue', label: 'Vencidas',   icon: '🔴',  colorClass: 'text-red-500' },
  { value: 'soon',    label: 'Por vencer', icon: '🟡',  colorClass: 'text-yellow-500' },
  { value: 'ok',      label: 'A tiempo',   icon: '🟢',  colorClass: 'text-green-500' },
]

export default function BoardFilters({ labels, filters, onFilterChange, onClearFilters }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const activeCount = (filters.labelId ? 1 : 0) + (filters.dueDateStatus ? 1 : 0)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleDueDateStatus(value) {
    onFilterChange({ ...filters, dueDateStatus: value === filters.dueDateStatus ? null : value })
  }

  function handleLabel(id) {
    onFilterChange({ ...filters, labelId: id === filters.labelId ? null : id })
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 text-sm font-medium border px-3 py-1.5 rounded-lg transition
          ${activeCount > 0
            ? 'text-violet-700 border-violet-300 bg-violet-50 hover:bg-violet-100'
            : 'text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
      >
        {/* Funnel icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Filtros
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold
            bg-violet-600 text-white rounded-full leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl shadow-lg border border-gray-200"
          style={{ width: 280 }}>

          {/* Due date section */}
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Fecha límite
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DUE_DATE_OPTIONS.map((opt) => {
                const selected = filters.dueDateStatus === opt.value
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => handleDueDateStatus(opt.value)}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition
                      ${selected
                        ? 'bg-violet-100 border-violet-400 text-violet-700'
                        : `bg-gray-100 border-transparent ${opt.colorClass} hover:border-gray-300`
                      }`}
                  >
                    {opt.icon && <span>{opt.icon}</span>}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Label section */}
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Etiqueta
            </p>
            {labels.length === 0 ? (
              <p className="text-xs text-gray-400">Sin etiquetas en este proyecto</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => {
                  const selected = filters.labelId === label.id
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleLabel(label.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition
                        ${selected
                          ? 'bg-violet-100 border-violet-400 text-violet-700'
                          : 'bg-gray-100 border-transparent text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Clear filters */}
          {activeCount > 0 && (
            <>
              <div className="border-t border-gray-100" />
              <div className="p-3">
                <button
                  onClick={() => { onClearFilters(); setOpen(false) }}
                  className="w-full text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50
                    py-1.5 rounded-lg transition"
                >
                  Limpiar filtros
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
