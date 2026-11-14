import subprocess
import sys

import imageio_ffmpeg

FILTER = (
    "fps=8,scale=360:-1:flags=lanczos,split[a][b];"
    "[a]palettegen=max_colors=48[p];[b][p]paletteuse=dither=bayer:bayer_scale=5"
)


def main():
    source, target = sys.argv[1], sys.argv[2]
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [ffmpeg, "-y", "-ss", "1.5", "-i", source, "-vf", FILTER, target],
        check=True,
    )


main()
