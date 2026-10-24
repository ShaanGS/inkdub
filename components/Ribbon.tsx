/** A slow, endless strip of speech bubbles. Pure CSS, so it costs nothing to render. */
export function Ribbon({ lines, reverse = false, tilt = 0 }: { lines: string[]; reverse?: boolean; tilt?: number }) {
  return (
    <div className="overflow-hidden py-3" style={{ transform: `rotate(${tilt}deg)` }} aria-hidden>
      <div className={`flex w-max gap-4 ${reverse ? "ribbon-reverse" : "ribbon"}`}>
        {[...lines, ...lines].map((line, i) => (
          <span
            key={i}
            className="relative shrink-0 rounded-[999px] border-2 border-ink bg-paper px-6 py-3 font-bubble text-lg font-bold whitespace-nowrap text-ink shadow-[4px_4px_0_0_var(--accent)]"
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
