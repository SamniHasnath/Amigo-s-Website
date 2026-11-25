// Small hand-drawn SVG illustrations for each menu category.
// Replace with real product photos later (put them in /public and use <img>).

const c = { cream: '#F3E7D5', coffee: '#7a4524', dark: '#3a2215', gold: '#E3AA65', mango: '#f4a51c', green: '#7fc8a9', bun: '#c98a3e', red: '#c9482f' };

export default function FoodArt({ slug, className = 'h-24 w-24' }: { slug: string; className?: string }) {
  const common = { viewBox: '0 0 120 120', className, 'aria-hidden': true } as const;
  switch (slug) {
    case 'coffee':
      return (
        <svg {...common}>
          <ellipse cx="60" cy="96" rx="44" ry="10" fill={c.dark} opacity=".5" />
          <ellipse cx="60" cy="90" rx="42" ry="9" fill={c.cream} />
          <path d="M30 48h60l-6 34a10 10 0 0 1-10 8H46a10 10 0 0 1-10-8z" fill={c.cream} />
          <path d="M90 56h6a10 10 0 0 1 0 20h-9" fill="none" stroke={c.cream} strokeWidth="6" />
          <ellipse cx="60" cy="48" rx="30" ry="7" fill={c.coffee} />
          <path d="M52 47c4-6 12-6 16 0-4 3-12 3-16 0z" fill={c.cream} />
          <path d="M50 30c-4-6 4-8 0-16M62 30c-4-6 4-8 0-16M74 30c-4-6 4-8 0-16" stroke={c.cream} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
        </svg>
      );
    case 'frappes-shakes':
      return (
        <svg {...common}>
          <path d="M38 40h44l-6 62H44z" fill={c.cream} opacity=".9" />
          <path d="M40 58h40l-4 44H44z" fill={c.coffee} />
          <path d="M34 40c0-14 52-14 52 0z" fill="#fff" />
          <circle cx="60" cy="24" r="6" fill={c.red} />
          <path d="M66 10l-6 30" stroke={c.gold} strokeWidth="5" strokeLinecap="round" />
          <path d="M44 44c6 4 26 4 32 0" stroke={c.gold} strokeWidth="3" fill="none" />
        </svg>
      );
    case 'juices-lemonades':
      return (
        <svg {...common}>
          <path d="M36 34h48l-8 70H44z" fill={c.cream} opacity=".35" />
          <path d="M39 50h42l-6 54H45z" fill={c.mango} />
          <circle cx="78" cy="38" r="14" fill={c.green} />
          <circle cx="78" cy="38" r="9" fill="#bfe8d4" />
          <path d="M56 12l8 40" stroke={c.cream} strokeWidth="5" strokeLinecap="round" />
          <path d="M44 60l10 10M64 76l8 8" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".6" />
        </svg>
      );
    case 'pastries':
      return (
        <svg {...common}>
          <ellipse cx="60" cy="92" rx="40" ry="8" fill={c.dark} opacity=".5" />
          {[[-30, 6, 12], [-16, 14, 16], [0, 18, 20], [16, 14, 16], [30, 6, 12]].map(([dx, h, r], i) => (
            <ellipse key={i} cx={60 + dx} cy={78 - h} rx={r * 0.8} ry={r} fill={i % 2 ? '#a8692a' : c.bun} transform={`rotate(${dx} ${60 + dx} ${78 - h})`} />
          ))}
        </svg>
      );
    case 'mains':
      return (
        <svg {...common}>
          <ellipse cx="60" cy="80" rx="46" ry="16" fill={c.cream} />
          <ellipse cx="60" cy="76" rx="34" ry="11" fill="#f0d9a8" />
          <path d="M34 74c8-8 14 6 22-2s14 6 22-2M38 80c8-6 16 4 24-2s12 4 20-2" stroke="#e8c27a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="70" r="4" fill={c.green} /><circle cx="70" cy="72" r="3" fill={c.green} />
          <path d="M92 30l-24 40" stroke={c.gold} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'panini-wraps':
      return (
        <svg {...common}>
          <path d="M20 70l40-30 40 30-40 22z" fill="#e7c98f" />
          <path d="M26 72l34-24 34 24-34 16z" fill={c.bun} />
          <path d="M30 74c10 4 20-4 30 2s20-2 30 0" stroke={c.green} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M34 78c10 3 18-3 26 1s18-1 26 0" stroke={c.red} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M40 60l40 0M44 66l32 0" stroke="#8a5521" strokeWidth="3" strokeLinecap="round" opacity=".6" />
        </svg>
      );
    case 'burgers-sandwiches':
      return (
        <svg {...common}>
          <path d="M24 56c0-22 72-22 72 0z" fill={c.bun} />
          <circle cx="48" cy="44" r="2" fill={c.cream} /><circle cx="62" cy="40" r="2" fill={c.cream} /><circle cx="74" cy="46" r="2" fill={c.cream} />
          <path d="M20 60c10 6 70 6 80 0v6H20z" fill={c.green} />
          <rect x="22" y="64" width="76" height="10" rx="5" fill="#8a4a20" />
          <path d="M22 74h76l-6 6H28z" fill={c.mango} />
          <path d="M24 80h72v6a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8z" fill={c.bun} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="60" cy="60" r="34" fill={c.coffee} />
          <path d="M44 60c10-14 22 14 32 0" stroke={c.cream} strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
}
