// Decorative background: soft aurora blobs + faint topographic contours.
export default function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="aurora-blob aurora-blob--teal -top-32 left-[8%] h-105 w-105" />
      <div className="aurora-blob aurora-blob--violet top-10 right-[6%] h-120 w-120" />
      <div className="aurora-blob aurora-blob--green top-65 left-[38%] h-90 w-90" />

      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="landing-contour" width="140" height="140" patternUnits="userSpaceOnUse">
            <ellipse cx="70" cy="70" rx="58" ry="40" fill="none" stroke="#8592A3" strokeWidth="0.5" opacity="0.14" />
            <ellipse cx="70" cy="70" rx="42" ry="28" fill="none" stroke="#8592A3" strokeWidth="0.5" opacity="0.11" />
            <ellipse cx="70" cy="70" rx="26" ry="17" fill="none" stroke="#8592A3" strokeWidth="0.5" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#landing-contour)" />
      </svg>

      {/* Fade the bottom into the page background */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-bg-base" />
    </div>
  );
}