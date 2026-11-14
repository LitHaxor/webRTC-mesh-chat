import json
from statistics import median, quantiles

from style import DATA, heading, render, style_axes

PHASES = [
    ("listMs", "Create, until the room is in every lobby"),
    ("connectMs", "Join, until both are connected"),
    ("noticeMs", 'Tab closed, until the other side shows "left"'),
    ("reconnectMs", "Rejoin, until connected again"),
]


def draw(figure, theme):
    saved = json.loads((DATA / "realtime.json").read_text())
    latency, phases = figure.subplots(1, 2, width_ratios=[1, 1.25])

    style_axes(latency, theme)
    values = saved["latencies"]
    middle = median(values)
    p95 = quantiles(values, n=20)[-1]
    bins = range(0, int(max(values)) + 4, 2)
    latency.hist(values, bins=bins, color=theme["blue"], edgecolor=theme["surface"], linewidth=1)
    latency.axvline(middle, color=theme["ink"], linewidth=1)
    top = latency.get_ylim()[1]
    latency.text(middle + 1, top * 0.94, f"median {middle:.0f} ms", fontsize=9, fontweight="bold", color=theme["ink"])
    latency.text(middle + 1, top * 0.86, f"95% under {p95:.0f} ms", fontsize=9, color=theme["secondary"])
    latency.set_xlabel("milliseconds from Enter to the other screen", color=theme["secondary"], fontsize=9)
    heading(latency, theme, f"{len(values)} messages, one after another", "how many arrived in each 2 ms window")

    style_axes(phases, theme, grid="x")
    rounds = saved["rounds"]
    for row, (key, label) in enumerate(reversed(PHASES)):
        times = [round_[key] for round_ in rounds]
        phases.scatter(times, [row] * len(times), s=36, color=theme["blue"], alpha=0.55, linewidth=0, zorder=3)
        typical = median(times)
        phases.plot([typical, typical], [row - 0.28, row + 0.28], color=theme["ink"], linewidth=2, zorder=4)
        phases.text(0, row + 0.36, f"{label}: {typical:,.0f} ms", fontsize=9, color=theme["ink"], va="bottom")
    phases.set_yticks([])
    phases.set_ylim(-0.6, len(PHASES) - 0.1)
    phases.set_xlim(left=0)
    phases.set_xlabel("milliseconds (each dot is one of the runs, the bar is the median)", color=theme["secondary"], fontsize=9)
    heading(phases, theme, f"Connecting, leaving and coming back, {len(rounds)} runs", "two Chrome windows on one machine")
    figure.subplots_adjust(wspace=0.12)


render("realtime", draw, (11.5, 5))
