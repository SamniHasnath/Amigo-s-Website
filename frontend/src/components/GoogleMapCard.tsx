import { useState, useRef, useCallback } from 'react';
import { useSettings, useToast } from '@/store';

interface GoogleMapCardProps {
  className?: string;
}

export default function GoogleMapCard({ className = '' }: GoogleMapCardProps) {
  const s = useSettings((st) => st.settings);
  const showToast = useToast((st) => st.show);

  // Map state
  const [viewMode, setViewMode] = useState<'map' | 'satellite'>('map');
  const [zoomLevel, setZoomLevel] = useState<number>(1.25);
  const [isSaved, setIsSaved] = useState(false);
  const [cardMinimized, setCardMinimized] = useState(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.1, Number((prev + 0.3).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.9, Number((prev - 0.3).toFixed(2))));
  };

  const handleReset = () => {
    setZoomLevel(1.25);
    setPan({ x: 0, y: 0 });
  };

  // Drag handlers for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // Bound the pan
    const maxPan = 100 * zoomLevel;
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, dragStart.current.panX + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, dragStart.current.panY + dy)),
    });
  }, [isDragging, zoomLevel]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragStart.current = { x: t.clientX, y: t.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      const maxPan = 100 * zoomLevel;
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, dragStart.current.panX + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, dragStart.current.panY + dy)),
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Amigo's Cafe - Trincomalee",
          text: "Check out Amigo's Cafe on 280 Main Street, Trincomalee!",
          url: s.mapsUrl,
        });
        return;
      } catch {
        // user cancelled or share failed, fallback to copy
      }
    }
    navigator.clipboard?.writeText(s.mapsUrl);
    showToast('Map link copied to clipboard!');
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    showToast(!isSaved ? "Saved to your Google Places" : "Removed from saved places");
  };

  // Google red pin coordinates on the 800x560 canvas
  const cafeX = 420;
  const cafeY = 275;

  return (
    <div
      className={`relative w-full aspect-[4/5] min-[420px]:aspect-[4/3] sm:aspect-[16/11] max-h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden border border-crema/15 shadow-2xl select-none bg-[#e5e3df] ${className}`}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Map Canvas Wrapper */}
      <div
        className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'} relative overflow-hidden`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Transform container for Pan and Zoom */}
        <div
          className="w-full h-full transition-transform duration-200 ease-out origin-center"
          style={{
            transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
          }}
        >
          {viewMode === 'map' ? (
            /* --- REALISTIC GOOGLE VECTOR MAP --- */
            <svg
              viewBox="0 0 800 560"
              className="w-full h-full block"
              style={{ minWidth: '100%', minHeight: '100%' }}
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Google Maps Water gradient & patterns */}
                <linearGradient id="gmap-water" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a5c9eb" />
                  <stop offset="60%" stopColor="#aad3df" />
                  <stop offset="100%" stopColor="#b4dbee" />
                </linearGradient>

                <linearGradient id="gmap-park" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c8e8c8" />
                  <stop offset="100%" stopColor="#bce2bc" />
                </linearGradient>

                <linearGradient id="gmap-sand" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f3ebdc" />
                  <stop offset="100%" stopColor="#ebe1cf" />
                </linearGradient>

                <filter id="pin-shadow" x="-30%" y="-10%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.32" />
                </filter>
                <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.18" />
                </filter>
              </defs>

              {/* 1. Base Landmass (Urban block tone: #f2f3f5) */}
              <rect width="800" height="560" fill="#f1f3f4" />

              {/* 2. City Blocks / Neighborhood plots */}
              <g fill="#eceff1" stroke="#e0e4e7" strokeWidth="1">
                <rect x="220" y="40" width="130" height="90" rx="3" />
                <rect x="230" y="150" width="120" height="100" rx="3" />
                <rect x="210" y="270" width="140" height="110" rx="3" />
                <rect x="200" y="400" width="150" height="120" rx="3" />

                <rect x="470" y="50" width="110" height="80" rx="3" />
                <rect x="480" y="150" width="120" height="95" rx="3" />
                <rect x="475" y="265" width="110" height="115" rx="3" />
                <rect x="470" y="400" width="130" height="120" rx="3" />

                {/* Sub-blocks near Main St */}
                <rect x="375" y="60" width="60" height="80" rx="2" fill="#e9edf0" />
                <rect x="370" y="380" width="65" height="120" rx="2" fill="#e9edf0" />
              </g>

              {/* 3. Parks & Green Areas (Google Maps green: #c5e8c5) */}
              {/* Fort Frederick Nature Reserve (North-East) */}
              <path
                d="M600,0 L800,0 L800,120 C760,115 700,90 660,70 C630,55 615,25 600,0 Z"
                fill="url(#gmap-park)"
              />
              {/* Dutch Bay Esplanade & Park */}
              <path
                d="M580,180 C600,210 610,260 625,320 C610,320 595,290 585,250 C575,220 575,195 580,180 Z"
                fill="#cdead0"
              />
              {/* Inner Harbour Green Pocket */}
              <circle cx="170" cy="240" r="32" fill="#d2ebd2" />
              <rect x="180" y="340" width="50" height="40" rx="6" fill="#d6edd6" />

              {/* 4. Waterbodies (Authentic Trincomalee Coastline) */}
              {/* Dutch Bay (East coast ocean) */}
              <path
                d="M635,0 C640,60 655,120 675,180 C700,250 725,310 755,380 C780,430 790,490 800,560 L800,0 Z"
                fill="url(#gmap-water)"
              />
              {/* Dutch Bay Sandy Beach Strip */}
              <path
                d="M635,0 C640,60 655,120 675,180 C700,250 725,310 755,380 C780,430 790,490 800,560"
                fill="none"
                stroke="url(#gmap-sand)"
                strokeWidth="10"
                strokeLinecap="round"
              />

              {/* Trincomalee Inner Harbour (West side bay) */}
              <path
                d="M0,0 L160,0 C150,90 140,160 110,230 C80,300 45,380 0,440 Z"
                fill="url(#gmap-water)"
              />
              <path
                d="M0,0 L160,0 C150,90 140,160 110,230 C80,300 45,380 0,440"
                fill="none"
                stroke="url(#gmap-sand)"
                strokeWidth="7"
              />

              {/* Water Labels */}
              <text x="735" y="140" fill="#2d6f94" fontSize="13" fontWeight="600" fontFamily="sans-serif" letterSpacing="1.5" opacity="0.85" transform="rotate(35 735 140)">
                DUTCH BAY
              </text>
              <text x="25" y="160" fill="#2d6f94" fontSize="11" fontWeight="600" fontFamily="sans-serif" letterSpacing="1.2" opacity="0.85" transform="rotate(-30 25 160)">
                INNER HARBOUR
              </text>
              <text x="710" y="470" fill="#327399" fontSize="12" fontWeight="500" fontFamily="sans-serif" opacity="0.75">
                Indian Ocean
              </text>

              {/* 5. Secondary / Local Road Network (Google white with soft grey casing) */}
              <g stroke="#d5dbdf" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {/* Dyke Street (along Dutch Bay) */}
                <path d="M605,0 C615,70 635,160 660,250 C685,340 710,430 735,560" />
                {/* Dockyard Road */}
                <path d="M380,290 L260,330 L170,390 L80,430" />
                {/* Central Road */}
                <path d="M140,160 L620,135" />
                {/* Court Road / Post Office Rd */}
                <path d="M120,260 L600,240" />
                {/* Sea View Avenue */}
                <path d="M370,360 L650,335" />
                {/* North connecting roads */}
                <path d="M160,80 L580,60" />
                {/* South connecting roads */}
                <path d="M100,480 L680,450" />
                {/* Cross links */}
                <path d="M260,40 L240,520" />
                <path d="M540,40 L560,520" />
              </g>

              {/* Secondary roads inner white fill */}
              <g stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M605,0 C615,70 635,160 660,250 C685,340 710,430 735,560" />
                <path d="M380,290 L260,330 L170,390 L80,430" />
                <path d="M140,160 L620,135" />
                <path d="M120,260 L600,240" />
                <path d="M370,360 L650,335" />
                <path d="M160,80 L580,60" />
                <path d="M100,480 L680,450" />
                <path d="M260,40 L240,520" />
                <path d="M540,40 L560,520" />
              </g>

              {/* 6. PRIMARY ARTERIAL ROAD: Main Street (A6) */}
              {/* Google Maps Arterial Orange Casing (#f7b552) */}
              <path
                d="M400,0 L410,120 L420,275 L435,420 L450,560"
                stroke="#f7b856"
                strokeWidth="16"
                strokeLinecap="square"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Arterial Yellow Fill (#fed89a) */}
              <path
                d="M400,0 L410,120 L420,275 L435,420 L450,560"
                stroke="#fed89a"
                strokeWidth="12"
                strokeLinecap="square"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Street Names Labels */}
              <text x="390" y="90" fill="#785d34" fontSize="11" fontWeight="700" fontFamily="sans-serif" transform="rotate(85 390 90)">
                Main St (A6)
              </text>
              <text x="412" y="340" fill="#785d34" fontSize="11" fontWeight="700" fontFamily="sans-serif" transform="rotate(84 412 340)">
                Main St
              </text>
              <text x="430" y="490" fill="#785d34" fontSize="11" fontWeight="700" fontFamily="sans-serif" transform="rotate(82 430 490)">
                Main St
              </text>

              <text x="635" y="270" fill="#666f75" fontSize="10" fontWeight="600" fontFamily="sans-serif" transform="rotate(76 635 270)">
                Dyke St
              </text>
              <text x="210" y="152" fill="#666f75" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                Central Rd
              </text>
              <text x="180" y="350" fill="#666f75" fontSize="10" fontWeight="600" fontFamily="sans-serif" transform="rotate(-20 180 350)">
                Dockyard Rd
              </text>
              <text x="500" y="235" fill="#666f75" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                Court Rd
              </text>

              {/* 7. Nearby Landmarks with Google POI icons */}
              {/* Clock Tower Landmark */}
              <g transform="translate(405, 140)" filter="url(#badge-shadow)">
                <circle cx="0" cy="0" r="11" fill="#4285f4" />
                <path d="M-3,-3 L0,0 L3,-1" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="0" cy="0" r="6" stroke="#ffffff" strokeWidth="1.2" fill="none" />
                <text x="15" y="4" fill="#3c4043" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                  Trinco Clock Tower
                </text>
              </g>

              {/* Dutch Bay Beach POI */}
              <g transform="translate(670, 215)" filter="url(#badge-shadow)">
                <circle cx="0" cy="0" r="11" fill="#12b5cb" />
                {/* Beach umbrella icon */}
                <path d="M-4,1 C-4,-4 4,-4 4,1 Z" fill="#ffffff" />
                <line x1="0" y1="1" x2="0" y2="4" stroke="#ffffff" strokeWidth="1.2" />
                <text x="15" y="4" fill="#1b3a4b" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                  Dutch Bay Beach
                </text>
              </g>

              {/* Fort Frederick Landmark */}
              <g transform="translate(680, 50)" filter="url(#badge-shadow)">
                <circle cx="0" cy="0" r="11" fill="#0f9d58" />
                <rect x="-4" y="-3" width="8" height="6" fill="#ffffff" rx="1" />
                <text x="-12" y="18" fill="#1b3a4b" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
                  Fort Frederick
                </text>
              </g>

              {/* St. Mary's Cathedral */}
              <g transform="translate(530, 110)" filter="url(#badge-shadow)">
                <circle cx="0" cy="0" r="9" fill="#9334e6" />
                <path d="M0,-4 L0,4 M-3,-1 L3,-1" stroke="#ffffff" strokeWidth="1.3" />
                <text x="13" y="3" fill="#4a3e5c" fontSize="9" fontWeight="500" fontFamily="sans-serif">
                  St. Mary's
                </text>
              </g>

              {/* 8. AMIGO'S CAFE LIVE PIN & RADAR BEACON */}
              {/* Radar beacon expanding rings at pin ground point */}
              <g transform={`translate(${cafeX}, ${cafeY})`}>
                <circle cx="0" cy="0" r="14" fill="#ea4335" opacity="0.3">
                  <animate attributeName="r" values="8;36;8" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.45;0.0;0.45" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="0" r="22" fill="#ea4335" opacity="0.2">
                  <animate attributeName="r" values="14;52;14" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0.0;0.35" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
                </circle>

                {/* Ground shadow beneath pin */}
                <ellipse cx="0" cy="2" rx="10" ry="4.5" fill="#202124" opacity="0.28" />

                {/* Iconic Google Red Pin */}
                <g filter="url(#pin-shadow)">
                  {/* Google teardrop pin path */}
                  <path
                    d="M0,0 C-12,-12 -18,-23 -18,-35 A18,18 0 1,1 18,-35 C18,-23 12,-12 0,0 Z"
                    fill="#ea4335"
                  />
                  {/* Dark bevel edge for 3D realism */}
                  <path
                    d="M0,0 C6,-12 18,-23 18,-35 A18,18 0 0,0 0,-53 L0,0 Z"
                    fill="#d93025"
                    opacity="0.35"
                  />
                  {/* White circle inside pin */}
                  <circle cx="0" cy="-35" r="9" fill="#ffffff" />
                  {/* Coffee cup icon inside white circle */}
                  <path
                    d="M-4.5,-37 L4.5,-37 C4.5,-37 4,-31 0,-31 C-4,-31 -4.5,-37 -4.5,-37 Z"
                    fill="#8d4925"
                  />
                  <path
                    d="M4.5,-36 C6,-36 6,-33 4.2,-33"
                    stroke="#8d4925"
                    strokeWidth="1"
                    fill="none"
                  />
                  <line x1="-3" y1="-30" x2="3" y2="-30" stroke="#8d4925" strokeWidth="0.9" />
                </g>

                {/* Pin hover / floating label badge */}
                <g transform="translate(24, -38)" filter="url(#badge-shadow)">
                  <rect x="0" y="-12" width="138" height="30" rx="15" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1" />
                  {/* Gold star */}
                  <text x="12" y="8" fontSize="13" fill="#fbbc04">★</text>
                  <text x="26" y="7" fill="#202124" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                    Amigo's Cafe
                  </text>
                  <text x="108" y="7" fill="#188038" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                    5.0
                  </text>
                </g>
              </g>
            </svg>
          ) : (
            /* --- SATELLITE VIEW (High-Res Aerial + Google Map Overlays) --- */
            <div className="w-full h-full relative overflow-hidden bg-black">
              <img
                src="/gallery/trinco-aerial.webp"
                alt="Trincomalee coastal bay aerial view"
                className="w-full h-full object-cover scale-110 filter brightness-[0.92] contrast-[1.08]"
              />

              {/* Satellite Road Overlay Vector */}
              <svg
                viewBox="0 0 800 560"
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <filter id="sat-text-shadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.9" />
                  </filter>
                </defs>

                {/* Translucent Satellite Main Street */}
                <path
                  d="M400,0 L410,120 L420,275 L435,420 L450,560"
                  stroke="#fed89a"
                  strokeWidth="8"
                  strokeOpacity="0.8"
                  fill="none"
                />
                <path
                  d="M605,0 C615,70 635,160 660,250 C685,340 710,430 735,560"
                  stroke="#ffffff"
                  strokeWidth="5"
                  strokeOpacity="0.6"
                  fill="none"
                />

                {/* Satellite Labels */}
                <text x="430" y="190" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="sans-serif" filter="url(#sat-text-shadow)">
                  Main Street (A6)
                </text>
                <text x="660" y="270" fill="#ffffff" fontSize="11" fontWeight="600" fontFamily="sans-serif" filter="url(#sat-text-shadow)">
                  Dyke St
                </text>
                <text x="680" y="140" fill="#a8e6cf" fontSize="13" fontWeight="700" fontFamily="sans-serif" filter="url(#sat-text-shadow)">
                  DUTCH BAY
                </text>
                <text x="40" y="160" fill="#a8e6cf" fontSize="12" fontWeight="700" fontFamily="sans-serif" filter="url(#sat-text-shadow)">
                  TRINCO HARBOUR
                </text>

                {/* Satellite Pin */}
                <g transform={`translate(${cafeX}, ${cafeY})`}>
                  <circle cx="0" cy="0" r="16" fill="#ea4335" opacity="0.4">
                    <animate attributeName="r" values="8;36;8" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <path
                    d="M0,0 C-12,-12 -18,-23 -18,-35 A18,18 0 1,1 18,-35 C18,-23 12,-12 0,0 Z"
                    fill="#ea4335"
                  />
                  <circle cx="0" cy="-35" r="9" fill="#ffffff" />
                  <path d="M-4.5,-37 L4.5,-37 C4.5,-37 4,-31 0,-31 C-4,-31 -4.5,-37 -4.5,-37 Z" fill="#8d4925" />
                  <g transform="translate(24, -38)">
                    <rect x="0" y="-12" width="138" height="30" rx="15" fill="rgba(32,33,36,0.9)" stroke="#555" strokeWidth="1" />
                    <text x="12" y="8" fontSize="13" fill="#fbbc04">★</text>
                    <text x="26" y="7" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="sans-serif">
                      Amigo's Cafe
                    </text>
                    <text x="108" y="7" fill="#34a853" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                      5.0
                    </text>
                  </g>
                </g>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* --- AUTHENTIC GOOGLE MAPS FLOATING PLACE CARD --- */}
      <div
        className={`absolute top-14 left-3 sm:top-4 sm:left-4 z-20 max-w-[calc(100%-64px)] sm:max-w-[340px] transition-all duration-200 ${
          cardMinimized ? 'w-auto' : 'w-full'
        }`}
      >
        <div className="bg-white/95 dark:bg-[#202124]/95 text-gray-900 dark:text-gray-100 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border border-black/10 dark:border-white/10 p-3.5 sm:p-4 text-left transition-all">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {s.cafeName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm">
                <span className="font-bold text-gray-900 dark:text-white">5.0</span>
                <span className="text-[#fbbc04] text-xs">★★★★★</span>
                <span className="text-gray-500 dark:text-gray-400">({s.reviews || 65})</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600 dark:text-gray-300">Café</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCardMinimized(!cardMinimized)}
              aria-label={cardMinimized ? 'Expand place details' : 'Minimize place card'}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg className={`w-4 h-4 transform transition-transform ${cardMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {!cardMinimized && (
            <>
              <div className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#188038]" />
                  <span className="font-semibold text-[#188038]">Open now</span>
                  <span className="text-gray-400">·</span>
                  <span>Closes 11:00 PM</span>
                </p>
                <p className="text-gray-500 dark:text-gray-400 truncate">{s.address}</p>
              </div>

              {/* Action Buttons: Directions, Save, Share */}
              <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <a
                  href={s.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm hover:shadow transition active:scale-[0.98]"
                >
                  {/* Google Directions Turn Arrow */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.43 10.59l-9.01-9.01c-.75-.75-2.07-.75-2.83 0l-9.01 9.01c-.75.75-.75 2.07 0 2.83l9.01 9.01c.75.75 2.07.75 2.83 0l9.01-9.01c.79-.79.79-2.08 0-2.83zm-8.43 3.41v-3h-4v4h-2v-5c0-.55.45-1 1-1h5v-3l4.5 4.5-4.5 4.5z" />
                  </svg>
                  <span>Directions</span>
                </a>

                <button
                  type="button"
                  onClick={handleToggleSave}
                  title={isSaved ? "Saved to your places" : "Save location"}
                  className={`p-2 rounded-full border text-xs sm:text-sm font-medium transition active:scale-95 flex items-center justify-center ${
                    isSaved
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 dark:border-amber-700'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  title="Share location"
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:scale-95 flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- LAYER SWITCHER (Map / Satellite) --- */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md rounded-lg shadow-md border border-black/10 dark:border-white/10 p-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setViewMode('map')}
          className={`px-2.5 py-1 rounded-md transition ${
            viewMode === 'map'
              ? 'bg-[#1a73e8] text-white shadow-xs'
              : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
          }`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setViewMode('satellite')}
          className={`px-2.5 py-1 rounded-md transition ${
            viewMode === 'satellite'
              ? 'bg-[#1a73e8] text-white shadow-xs'
              : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* --- GOOGLE MAPS CONTROLS: Zoom, Pegman, Recenter --- */}
      <div className="absolute bottom-8 right-3 sm:bottom-8 sm:right-4 z-20 flex flex-col items-center gap-1.5">
        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleReset}
          title="Center on Amigo's Cafe"
          className="w-8 h-8 sm:w-9 sm:h-9 bg-white/95 dark:bg-[#202124]/95 text-gray-700 dark:text-gray-200 rounded-lg shadow-md border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95"
        >
          {/* Target crosshair icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="8" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <line x1="12" y1="2" x2="12" y2="5" strokeWidth="2" />
            <line x1="12" y1="19" x2="12" y2="22" strokeWidth="2" />
            <line x1="2" y1="12" x2="5" y2="12" strokeWidth="2" />
            <line x1="19" y1="12" x2="22" y2="12" strokeWidth="2" />
          </svg>
        </button>

        {/* Pegman (Street View figure) */}
        <a
          href={s.mapsUrl}
          target="_blank"
          rel="noreferrer"
          title="Open in Street View / Google Maps"
          className="w-8 h-8 sm:w-9 sm:h-9 bg-white/95 dark:bg-[#202124]/95 rounded-lg shadow-md border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95"
        >
          {/* Yellow Google Pegman Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#fbbc04">
            <circle cx="12" cy="5" r="2.8" />
            <path d="M9.5,8.5 L14.5,8.5 C15.3,8.5 16,9.2 16,10 L16,15 L14,15 L14,21 L10,21 L10,15 L8,15 L8,10 C8,9.2 8.7,8.5 9.5,8.5 Z" />
          </svg>
        </a>

        {/* Zoom In & Out Pill */}
        <div className="flex flex-col bg-white/95 dark:bg-[#202124]/95 rounded-lg shadow-md border border-black/10 dark:border-white/10 overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:bg-gray-200 font-bold text-lg"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition active:bg-gray-200 font-bold text-lg"
          >
            −
          </button>
        </div>
      </div>

      {/* --- GOOGLE LOGO & FOOTER BAR --- */}
      {/* Google Multi-colored Logo (Bottom Left) */}
      <div className="absolute bottom-1.5 left-2.5 sm:bottom-2 sm:left-3 z-20 pointer-events-auto">
        <a
          href={s.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 opacity-90 hover:opacity-100 transition group"
          title="Open in Google Maps"
        >
          {/* Official Google Brand Colors Logo */}
          <span className="font-['Product_Sans',Roboto,sans-serif] font-bold text-sm sm:text-base tracking-tight drop-shadow-sm select-none">
            <span className="text-[#4285F4]">G</span>
            <span className="text-[#EA4335]">o</span>
            <span className="text-[#FBBC05]">o</span>
            <span className="text-[#4285F4]">g</span>
            <span className="text-[#34A853]">l</span>
            <span className="text-[#EA4335]">e</span>
          </span>
        </a>
      </div>

      {/* Google Maps Legal / Attribution Footer (Bottom Right) */}
      <div className="absolute bottom-1 right-2 sm:bottom-1.5 sm:right-3 z-20 text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-300 font-sans flex items-center gap-2 pointer-events-none drop-shadow-sm">
        <span className="hidden sm:inline">Keyboard shortcuts</span>
        <span>Map data ©2026 Google</span>
        <a href={s.mapsUrl} target="_blank" rel="noreferrer" className="pointer-events-auto hover:underline hidden xs:inline">
          Terms
        </a>
        <a href={s.mapsUrl} target="_blank" rel="noreferrer" className="pointer-events-auto hover:underline hidden sm:inline">
          Report a map error
        </a>
      </div>
    </div>
  );
}
