import json

from style import DATA, heading, render, style_axes

TICKS = {
    100: "100",
    500: "500",
    1000: "1k",
    2500: "2.5k",
    5000: "5k",
    10_000: "10k",
    20_000: "20k",
}
RUNS = [
    ("large-volume-before.json", "before: every message on the page", "orange"),
    ("large-volume.json", "after: only what is on screen", "blue"),
]


def load(name):
    saved = json.loads((DATA / name).read_text())
    rows = sorted(saved.values(), key=lambda row: row["size"])
    return [{**row, "renderS": row["renderMs"] / 1000} for row in rows]


def label(value, unit):
    if value >= 10:
        return f"{value:,.0f}{unit}"
    return f"{value:.1f}{unit}"


def panel(ax, theme, title, subtitle, key, unit, legend=False):
    style_axes(ax, theme)
    ax.axvline(10_000, color=theme["axis"], linewidth=1)
    for name, description, colour in RUNS:
        rows = load(name)
        sizes = [row["size"] for row in rows]
        ax.plot(
            sizes,
            [row[key] for row in rows],
            color=theme[colour],
            linewidth=2,
            marker="o",
            markersize=5,
            label=description,
        )
        at_10k = next(row[key] for row in rows if row["size"] == 10_000)
        ax.annotate(
            label(at_10k, unit),
            (10_000, at_10k),
            xytext=(-7, 7),
            textcoords="offset points",
            ha="right",
            fontsize=9,
            fontweight="bold",
            color=theme["ink"],
        )
    ax.set_xscale("log")
    ax.set_xticks(sizes)
    ax.set_xticklabels([TICKS[size] for size in sizes])
    ax.minorticks_off()
    ax.set_ylim(bottom=0)
    if legend:
        ax.legend(frameon=False, fontsize=9, labelcolor=theme["secondary"], loc="upper left")
    heading(ax, theme, title, subtitle)


def draw(figure, theme):
    axes = figure.subplots(2, 2)
    panel(axes[0][0], theme, "Opening the room", "seconds until the saved history is on screen", "renderS", " s", legend=True)
    panel(axes[0][1], theme, "Smoothness with nothing happening", "frames per second while the room sits idle (60 is smooth)", "fps", " fps")
    panel(axes[1][0], theme, "A new message appearing", "milliseconds from their Enter to your screen", "receiveMs", " ms")
    panel(axes[1][1], theme, "Memory", "megabytes of JavaScript heap in that tab", "heapMb", " MB")
    for ax in axes[1]:
        ax.set_xlabel("messages in the room", color=theme["secondary"], fontsize=9)
    figure.subplots_adjust(hspace=0.62, wspace=0.2)


render("large-volume", draw, (10.5, 7.2))
