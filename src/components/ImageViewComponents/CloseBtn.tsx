import { X } from "lucide-react";

export function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn-icon" onClick={onClick}>
      <X size={14} />
    </button>
  );
}
