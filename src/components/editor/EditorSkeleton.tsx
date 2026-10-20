export function EditorSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-2.5 bg-editor p-5">
      {[62, 40, 75, 55, 30, 68, 45, 20].map((w, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="w-5 text-right font-mono text-xs text-muted-foreground/50">{i + 1}</span>
          <div className="h-3 animate-pulse rounded bg-accent/60" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}
