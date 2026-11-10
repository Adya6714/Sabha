export function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-maroon ${className}`}>
      <svg
        viewBox="0 0 64 40"
        aria-hidden="true"
        className="h-5 w-[30px] shrink-0"
      >
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M32 4c6 8 6 22 0 32-6-10-6-24 0-32z" />
          <path d="M32 36c-8-4-15-12-16-24 8 2 14 10 16 24z" />
          <path d="M32 36c8-4 15-12 16-24-8 2-14 10-16 24z" />
        </g>
      </svg>
      <span className="font-serif text-[22px] leading-none tracking-tight">
        Sabha
      </span>
    </span>
  );
}
