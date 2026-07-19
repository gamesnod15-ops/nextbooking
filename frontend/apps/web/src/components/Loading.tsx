/**
 * Route-level loading indicator (used as the Suspense fallback by the
 * `loading.tsx` files).
 *
 * Deliberately NOT a full-screen overlay: the previous version covered the
 * whole viewport with a "Yükleniyor..." card, so visitors stared at a blank
 * white screen even though the server-rendered page was already sitting in
 * the DOM underneath it. A slim top bar gives the same feedback without
 * hiding anything.
 */
export function Loading() {
  return (
    <div
      role="status"
      aria-label="Yükleniyor"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-brand-100"
    >
      <div className="h-full w-1/3 animate-loading-bar rounded-full bg-brand-500" />
    </div>
  )
}
