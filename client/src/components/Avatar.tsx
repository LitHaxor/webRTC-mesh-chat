type Props = {
  name: string;
  active: boolean;
};

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/);
  const initials = words.map((word) => word[0]).join("");
  return initials.slice(0, 2).toUpperCase();
};

const getHue = (name: string) => {
  let hash = 0;
  for (const char of name) {
    hash += char.charCodeAt(0);
  }
  return hash % 360;
};

const Avatar = ({ name, active }: Props) => {
  return (
    <span
      style={{ backgroundColor: `hsl(${getHue(name)} 55% 45%)` }}
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
    >
      {getInitials(name)}
      <span
        title={active ? "Active" : "Left"}
        className={`absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-white ${active ? "bg-green-500" : "bg-neutral-400"}`}
      />
    </span>
  );
};

export default Avatar;
