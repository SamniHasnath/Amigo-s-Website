/** The wordmark: soft bold serif in rust, like a bakery sign, with spaced "CAFÉ" underneath (optional). */
export default function Logo({ className = 'text-3xl', sub = false }: { className?: string; sub?: boolean }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="font-display font-extrabold lowercase tracking-tight text-caramel">amigo's</span>
      {sub && <span className="mt-1 font-sans text-[0.28em] font-semibold uppercase tracking-[0.4em] text-crema-200">Café · Trincomalee</span>}
    </span>
  );
}
