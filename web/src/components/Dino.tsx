export default function Dino({ className }: { className?: string }) {
  return (
    <span className={className} aria-label="공룡" role="img">
      🦖
    </span>
  );
}
