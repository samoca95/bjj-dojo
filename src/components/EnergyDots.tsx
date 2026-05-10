export default function EnergyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-sm ${i < level ? 'bg-gold' : 'bg-zinc-700'}`}
        />
      ))}
    </div>
  )
}
