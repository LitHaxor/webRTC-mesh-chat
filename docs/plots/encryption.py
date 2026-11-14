import json

from style import DATA, heading, render, style_axes

KB = 1000


def draw(figure, theme):
    saved = json.loads((DATA / "encryption.json").read_text())["crypto"]
    sent = [row for row in saved["sweep"] if row["ok"]]
    failed = [row for row in saved["sweep"] if not row["ok"]]
    limit = saved["largestAscii"] / KB
    channel = saved["channelLimit"] / KB
    last = sent[-1]
    ratio = last["frameBytes"] / last["textBytes"]

    ax = figure.add_subplot()
    style_axes(ax, theme)
    ax.axvspan(limit, 265, color=theme["critical"], alpha=0.07, linewidth=0)
    ax.axvline(limit, color=theme["critical"], linewidth=1.2)
    ax.axhline(channel, color=theme["axis"], linewidth=1)
    ax.plot(
        [row["textBytes"] / KB for row in sent],
        [row["frameBytes"] / KB for row in sent],
        color=theme["blue"],
        linewidth=2,
        marker="o",
        markersize=5,
    )
    ax.scatter(
        [row["textBytes"] / KB for row in failed if row["textBytes"] / KB <= 260],
        [4] * len([row for row in failed if row["textBytes"] / KB <= 260]),
        marker="x",
        s=46,
        color=theme["critical"],
        linewidth=1.8,
        zorder=4,
    )
    ax.text(4, 168, f"on the wire, a message is\n{ratio:.2f}x its own size", fontsize=9, color=theme["ink"])
    ax.text(limit + 3, 150, f"past {saved['largestAscii']:,} bytes\nthe message is never sent", fontsize=9, fontweight="bold", color=theme["ink"])
    ax.text(limit + 3, 118, "x  sizes that were tried and failed", fontsize=9, color=theme["secondary"])
    ax.text(2, channel + 4, f"Chrome's data channel limit, {saved['channelLimit']:,} bytes", fontsize=9, color=theme["secondary"])
    ax.set_xlim(0, 265)
    ax.set_ylim(0, 290)
    ax.set_xlabel("message size, in kilobytes of UTF-8", color=theme["secondary"], fontsize=9)
    heading(
        ax,
        theme,
        "How big an encrypted message can get",
        "Kilobytes sent over the data channel for each message size, measured in Chrome",
    )


render("encryption-limit", draw, (7.6, 4.2))
