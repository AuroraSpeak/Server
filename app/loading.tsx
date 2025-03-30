export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center bg-aura-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-aura-primary border-solid"></div>
        <p className="text-aura-text-muted">Lade AuraSpeak...</p>
      </div>
    </div>
  )
}

