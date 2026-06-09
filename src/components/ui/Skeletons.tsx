export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <p className="loading-text">{text}</p>
    </div>
  );
}
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line w-80" />
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-40" />
    </div>
  );
}
export function SkeletonList({ count = 3 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}</>;
}
