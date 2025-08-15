import { EMOJIS } from '@/comments/core/rules';

export const ReactionBar = ({ counts, onToggle }: { counts: Record<typeof EMOJIS[number], number>; onToggle: (emoji: typeof EMOJIS[number]) => void }) => {
  return (
    <div className="flex gap-2">
      {EMOJIS.map((e) => (
        <button key={e} onClick={() => onToggle(e)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-accent" aria-label={`React ${e}`}>
          <span>{e}</span>
          <span className="text-xs text-muted-foreground">{counts[e] || 0}</span>
        </button>
      ))}
    </div>
  );
};
