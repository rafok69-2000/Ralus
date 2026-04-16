import { PROJECT_COLORS } from '../utils/projectColors'

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map(color => {
        const selected = value === color.hex
        return (
          <button
            key={color.hex}
            type="button"
            title={color.name}
            onClick={() => onChange(color.hex)}
            className={`w-6 h-6 rounded-full transition-all ${selected ? 'scale-110' : 'hover:scale-110'}`}
            style={{
              backgroundColor: color.hex,
              boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${color.hex}` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
