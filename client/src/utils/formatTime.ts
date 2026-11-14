const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000],
];

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "always" });

export const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

export const formatRelativeTime = (time: number, now: number) => {
  const elapsed = time - now;
  const [unit, size] = units.find(([, size]) => Math.abs(elapsed) >= size) ?? [
    "second",
    1_000,
  ];
  return relativeTime.format(Math.trunc(elapsed / size), unit);
};
