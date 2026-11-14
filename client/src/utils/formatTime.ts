const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "always" });

export const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

export const formatRelativeTime = (time: number, now: number) => {
  const age = Math.max(now - time, 0);
  const unit = units.find(([, size]) => age >= size);
  if (!unit) {
    return "a few seconds ago";
  }
  const [name, size] = unit;
  return relativeTime.format(-Math.trunc(age / size), name);
};
