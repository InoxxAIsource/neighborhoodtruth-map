import { MapPin } from "lucide-react";

const BADGE_TEXT = "DISCOVER · LABELS · HONEST · MAP ·";

export function RotatingBadge({ onClick }: { onClick?: () => void }) {
  const repetitions = 3;
  const offsetIncrement = 100 / repetitions;

  return (
    <div
      className="fixed top-4 right-4 md:top-6 md:right-8 w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[140px] lg:h-[140px] z-[2000] cursor-pointer animate-fade-in"
      style={{ animationDelay: "0.2s" }}
      onClick={onClick}
      aria-label="Explore the map"
    >
      <div className="w-full h-full relative" style={{ animation: "spin 24s linear infinite" }}>
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0">
          <circle cx="100" cy="100" r="96" fill="white" stroke="black" strokeWidth="2" />
          <defs>
            <path id="pl-circle" d="M 100,20 a 80,80 0 1,1 0,160 a 80,80 0 1,1 0,-160" />
          </defs>
          {Array.from({ length: repetitions }).map((_, i) => (
            <text key={i} fontSize="14" fontWeight="700" fill="black" letterSpacing="1">
              <textPath href="#pl-circle" startOffset={`${i * offsetIncrement}%`}>
                {BADGE_TEXT}
              </textPath>
            </text>
          ))}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black rounded-full w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 flex items-center justify-center">
            <MapPin className="text-white w-3 h-3 md:w-4 md:h-4 lg:w-6 lg:h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
