const layers = [
  {
    id: "intention",
    label: "Human intention",
    tone: "maroon" as const,
  },
  {
    id: "governance",
    label: "Sabha governance layer",
    tone: "green" as const,
    children: [
      "Living Memory",
      "Policy & Authority Registry",
      "Delegation Map",
    ],
  },
  {
    id: "agents",
    label: "Personal AI / Agent",
    tone: "ink" as const,
    children: ["Sub-agents & external tools"],
  },
  {
    id: "proposal",
    label: "Proposed action",
    tone: "ink" as const,
  },
  {
    id: "deliberation",
    label: "Deliberation",
    tone: "green" as const,
    children: [
      "Council: independent challenges",
      "Influence & Incentive Audit",
      "Gate: permission & risk",
    ],
  },
];

const outcomes = [
  { label: "Execute", note: "Auto", tone: "leaf" as const },
  { label: "Human approval", note: "Approval required", tone: "amber" as const },
  { label: "Block", note: "Not authorised", tone: "red" as const },
];

const toneBorder = {
  maroon: "border-maroon/40",
  green: "border-green/35",
  ink: "border-ink/20",
  leaf: "border-leaf/40",
  amber: "border-amber/40",
  red: "border-red/40",
};

const toneText = {
  maroon: "text-maroon",
  green: "text-green",
  ink: "text-ink",
  leaf: "text-leaf",
  amber: "text-amber",
  red: "text-red",
};

export function ArchitectureDiagram() {
  return (
    <figure className="w-full" aria-label="Sabha proposed architecture">
      <div className="relative overflow-hidden rounded-[1.25rem] border border-line bg-[linear-gradient(165deg,color-mix(in_srgb,var(--bg-deep)_70%,#fff)_0%,var(--bg)_45%,color-mix(in_srgb,var(--green)_6%,var(--bg))_100%)] px-4 py-6 sm:px-6 sm:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--ink)_12%,transparent)_1px,transparent_0)] [background-size:18px_18px]"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-stretch gap-3">
          {layers.map((layer, index) => (
            <div key={layer.id} className="flex flex-col items-center gap-3">
              <div
                className={`w-full border bg-card/80 px-4 py-3 text-center backdrop-blur-sm ${toneBorder[layer.tone]} animate-rise`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <p
                  className={`font-serif text-lg sm:text-xl ${toneText[layer.tone]}`}
                >
                  {layer.label}
                </p>
                {"children" in layer && layer.children ? (
                  <ul className="mt-3 flex flex-wrap justify-center gap-2">
                    {layer.children.map((child) => (
                      <li
                        key={child}
                        className="border border-line bg-soft/70 px-2.5 py-1 text-xs text-ink2 sm:text-[13px]"
                      >
                        {child}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {index < layers.length - 1 ? (
                <div
                  aria-hidden
                  className="h-5 w-px bg-gradient-to-b from-mute/70 to-mute/20"
                />
              ) : null}
            </div>
          ))}

          <div aria-hidden className="mx-auto h-5 w-px bg-mute/40" />

          <div className="grid gap-2 sm:grid-cols-3">
            {outcomes.map((outcome) => (
              <div
                key={outcome.label}
                className={`border bg-card/90 px-3 py-3 text-center ${toneBorder[outcome.tone]}`}
              >
                <p className={`text-sm font-medium ${toneText[outcome.tone]}`}>
                  {outcome.label}
                </p>
                <p className="mt-1 text-xs text-mute">{outcome.note}</p>
              </div>
            ))}
          </div>

          <div aria-hidden className="mx-auto h-5 w-px bg-mute/40" />

          <div className="border border-maroon/35 bg-card/90 px-4 py-3 text-center">
            <p className="font-serif text-lg text-maroon">Governance Receipt</p>
            <p className="mt-1 text-xs text-ink2">
              Intention · delegation · evidence · approvals · outcome
            </p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-mute">
        Target architecture — not a description of what the current prototype
        already enforces.
      </figcaption>
    </figure>
  );
}
