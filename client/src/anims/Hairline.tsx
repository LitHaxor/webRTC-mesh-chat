import { useEffect, useRef } from "react";
import { mk, tour, type FigureMount, type Tour } from "./core/stage.ts";
import { inject } from "./core/styles.ts";

type Props = {
  mount: FigureMount;
  stops: Tour;
  value: number;
  label: string;
};

const Hairline = ({ mount, stops, value, label }: Props) => {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    inject(document);
    const svg = mk(
      "svg",
      { viewBox: "0 0 400 320", "aria-hidden": "true" },
      stage,
    );
    const figure = mount({ stage, svg, read: { textContent: null } }, value);
    const playing = tour(stage, stops);
    return () => {
      playing.stop();
      figure.destroy();
      svg.remove();
    };
  }, [mount, stops, value]);

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={label}
      data-hairline=""
      className="w-48"
    />
  );
};

export default Hairline;
