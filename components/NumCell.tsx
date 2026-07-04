"use client";

/**
 * One score input cell. iOS numeric keypads have no minus key, so fields
 * that allow negatives get a ± toggle next to the input.
 */
export function NumCell({
  value,
  onChange,
  allowNegative,
  compact,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowNegative?: boolean;
  compact?: boolean;
}) {
  function parse(raw: string) {
    const n = parseInt(raw, 10);
    onChange(Number.isNaN(n) ? undefined : n);
  }

  return (
    <div className="flex items-center gap-1">
      <input
        inputMode="numeric"
        value={value ?? ""}
        placeholder="0"
        onChange={(e) => parse(e.target.value)}
        onFocus={(e) => e.target.select()}
        className={`w-full bg-card-raised border border-edge rounded-lg text-center font-semibold outline-none focus:border-accent placeholder:text-ink-dim/50 ${
          compact ? "py-1.5" : "py-2.5"
        }`}
      />
      {allowNegative && (
        <button
          tabIndex={-1}
          onClick={() => value !== undefined && value !== 0 && onChange(-value)}
          className="shrink-0 w-8 self-stretch rounded-lg bg-card-raised border border-edge text-ink-dim font-bold active:bg-edge"
          aria-label="Flip sign"
        >
          ±
        </button>
      )}
    </div>
  );
}
