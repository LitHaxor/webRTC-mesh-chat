from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "docs" / "data"
IMAGES = ROOT / "docs" / "images"

THEME = {
    "surface": "#ffffff",
    "ink": "#0b0b0b",
    "secondary": "#52514e",
    "muted": "#898781",
    "grid": "#e1e0d9",
    "axis": "#c3c2b7",
    "blue": "#2a78d6",
    "orange": "#eb6834",
    "critical": "#d03b3b",
}


def style_axes(ax, theme, grid="y"):
    ax.set_facecolor(theme["surface"])
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(theme["axis"])
    ax.spines["bottom"].set_linewidth(1)
    ax.tick_params(colors=theme["muted"], labelsize=9, length=0, pad=6)
    ax.grid(False)
    if grid:
        ax.grid(axis=grid, color=theme["grid"], linewidth=0.8)
    ax.set_axisbelow(True)


def heading(ax, theme, title, subtitle=None):
    ax.annotate(
        title,
        (0, 1),
        xycoords="axes fraction",
        xytext=(0, 30 if subtitle else 12),
        textcoords="offset points",
        fontsize=11.5,
        fontweight="bold",
        color=theme["ink"],
        annotation_clip=False,
    )
    if subtitle:
        ax.annotate(
            subtitle,
            (0, 1),
            xycoords="axes fraction",
            xytext=(0, 13),
            textcoords="offset points",
            fontsize=9,
            color=theme["secondary"],
            annotation_clip=False,
        )


def render(name, draw, size):
    IMAGES.mkdir(parents=True, exist_ok=True)
    plt.rcParams["font.family"] = ["Helvetica Neue", "Arial", "DejaVu Sans"]
    figure = plt.figure(figsize=size, facecolor=THEME["surface"])
    draw(figure, THEME)
    figure.savefig(
        IMAGES / f"{name}.png",
        dpi=200,
        facecolor=THEME["surface"],
        bbox_inches="tight",
        pad_inches=0.3,
    )
    plt.close(figure)
