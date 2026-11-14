import { X } from "lucide-react";

type Props = {
  title: string;
  onLeave?: () => void;
};

const Header = ({ title, onLeave }: Props) => {
  return (
    <header className="flex items-center justify-between border-b border-neutral-300 px-6 py-5">
      <h1 className="truncate text-lg font-semibold">{title}</h1>
      {onLeave && (
        <button
          type="button"
          aria-label="Leave room"
          onClick={onLeave}
          className="text-neutral-600 hover:text-neutral-900"
        >
          <X className="size-6" />
        </button>
      )}
    </header>
  );
};

export default Header;
