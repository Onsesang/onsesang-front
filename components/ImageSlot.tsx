// Empty image placeholder, standing in for the prototype's <image-slot> until real product photos exist.
export default function ImageSlot({ label }: { label: string }) {
  return (
    <div className="image-slot" role="img" aria-label={label}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
