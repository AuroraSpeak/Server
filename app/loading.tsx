export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center bg-[hsl(var(--aura-bg))]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[hsl(var(--aura-primary))] border-solid"></div>
        <p className="text-[hsl(var(--aura-text-muted))]">Lade AuraSpeak...</p>
      </div>
    </div>
  )
}

