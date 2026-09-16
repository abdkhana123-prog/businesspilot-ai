"use client";

type BrandLogoProps = {
  compact?: boolean;
  light?: boolean;
};

export default function BrandLogo({
  compact = false,
  light = false,
}: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
          compact ? "h-10 w-10" : "h-12 w-12"
        } ${
          light
            ? "bg-white text-slate-950"
            : "bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-white"
        } shadow-lg shadow-cyan-500/20`}
      >
        <span className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white/20 blur-md" />

        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative h-7 w-7"
          aria-hidden="true"
        >
          <path
            d="M24 7L28.2 18.8L40 23L28.2 27.2L24 39L19.8 27.2L8 23L19.8 18.8L24 7Z"
            fill="currentColor"
            fillOpacity="0.95"
          />

          <circle
            cx="24"
            cy="23"
            r="4.5"
            fill="currentColor"
            fillOpacity="0.35"
          />

          <path
            d="M35.5 10.5L38 13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <path
            d="M10 35L13 32"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!compact && (
        <div>
          <p
            className={`text-xl font-black tracking-tight ${
              light ? "text-white" : "text-white"
            }`}
          >
            BusinessPilot
          </p>

          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-300">
            Intelligent workspace
          </p>
        </div>
       )}
    </div>
  );
}
