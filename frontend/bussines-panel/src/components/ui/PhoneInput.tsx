function formatLocalDigits(d: string) {
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
}

export function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const raw = value.replace(/\D/g, '')
  const local = raw.startsWith('90') ? raw.slice(2) : raw.startsWith('0') ? raw.slice(1) : raw
  const display = formatLocalDigits(local.slice(0, 10))
  return (
    <div className="flex w-full overflow-hidden rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring">
      <span className="flex select-none items-center gap-1 border-r bg-muted/50 px-3 py-2 text-sm text-muted-foreground shrink-0">
        🇹🇷 +90
      </span>
      <input
        value={display}
        onChange={e => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
          onChange(digits ? `+90${digits}` : '')
        }}
        className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
        placeholder="555 000 00 00"
      />
    </div>
  )
}
