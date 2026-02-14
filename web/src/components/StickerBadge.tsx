export type Badge = {
  id: string;
  label: string;
  emoji: string;
  achieved: boolean;
};

export default function StickerBadge({ badge }: { badge: Badge }) {
  return (
    <div
      className={`card flex items-center gap-2 px-3 py-2 ${badge.achieved ? '' : 'opacity-40'}`}
      title={badge.label}
    >
      <div className="text-xl" aria-hidden>
        {badge.emoji}
      </div>
      <div className="text-sm font-extrabold">{badge.label}</div>
    </div>
  );
}
