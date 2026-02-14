export type Badge = {
  id: string;
  label: string;
  emoji: string;
  achieved: boolean;
};

export default function StickerBadge({ badge, onClick }: { badge: Badge; onClick?: (b: Badge) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(badge)}
      className={`card focus-ring flex items-center gap-2 px-3 py-2 ${badge.achieved ? '' : 'opacity-40'}`}
      title={badge.label}
    >
      <div className="text-xl" aria-hidden>
        {badge.emoji}
      </div>
      <div className="text-sm font-extrabold">{badge.label}</div>
    </button>
  );
}
