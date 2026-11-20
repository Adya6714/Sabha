export function CarpetFrame() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] hidden sm:block"
    >
      <div className="carpet-edge carpet-edge-top" />
      <div className="carpet-edge carpet-edge-bottom" />
      <div className="carpet-edge carpet-edge-left" />
      <div className="carpet-edge carpet-edge-right" />
      <img
        src="/motifs/corner.svg"
        alt=""
        className="absolute left-1 top-1 h-10 w-10"
      />
      <img
        src="/motifs/corner.svg"
        alt=""
        className="absolute right-1 top-1 h-10 w-10 rotate-90"
      />
      <img
        src="/motifs/corner.svg"
        alt=""
        className="absolute bottom-1 left-1 h-10 w-10 -rotate-90"
      />
      <img
        src="/motifs/corner.svg"
        alt=""
        className="absolute bottom-1 right-1 h-10 w-10 rotate-180"
      />
    </div>
  );
}

export function MotifRule({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`motif-rule mx-auto h-3 max-w-md ${className}`}
    />
  );
}
