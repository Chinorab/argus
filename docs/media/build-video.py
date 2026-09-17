"""Assembles the demo video from the OBS take, the cards, the voice-over and the subtitles.
   python docs/media/build-video.py
Output: docs/media/argus-demo.mp4 (1920x1080, 30 fps, H.264 + AAC, burned-in subtitles).
"""
import os, pathlib, re, subprocess, shutil

HERE = pathlib.Path(__file__).parent
FFMPEG = r"C:\Users\Anas\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
RAW = HERE / "raw" / "2026-09-17 18-33-51.mp4"
CARDS = HERE / "cards"
WORK = HERE / "work" / "seg"
OUT = HERE / "argus-demo.mp4"
VO = HERE / "voiceover.mp3"
SRT = HERE / "voiceover.srt"

# Crop the useful area of the 1280x720 take (the app column is centred) and scale to 1080p.
RAW_VF = "crop=1066:600:107:60,scale=1920:1080:flags=lanczos"
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", "-an"]

# Silences inserted in the voice-over (seconds in the original track, duration).
SILENCES = [(67.513, 2.0), (127.929, 2.0)]

# Timeline: (kind, source, start_in_source, duration). Kinds: raw | card | png.
# Target times follow the voice-over cues (see docs/media/voiceover.srt) plus the two silences.
SEGMENTS = [
    ("card", "01-title.png",               0,     4.0),   # cue 1
    ("card", "02a-photos-two-kitchens.png", 0,    10.0),   # cues 2-3
    ("card", "02b-verdicts-two-kitchens.png", 0,   9.3),   # cues 4-7  -> 23.3
    ("raw",  RAW,  31.5,  9.2),                            # cues 8-10: form loads, voice note -> 32.5
    ("raw",  RAW,  36.0,  7.1),                            # cues 11-13: logs, statement, run click -> 39.6
    ("raw",  RAW,  43.1,  1.6),                            # cue 14: "Now watch the agent work" -> 41.2
    ("raw",  RAW,  44.7, 11.3),                            # cues 15-16: perception chips, notes, logs -> 52.5
    ("raw",  RAW, 147.0, 15.0),                            # cues 17-18: Ultra thinking, report lands (162) -> 67.5
    ("raw",  RAW, 162.0,  2.0),                            # silence 1: hold on the red banner -> 69.5
    ("raw",  RAW, 164.0,  6.0),                            # cues 19-21 -> 75.5
    ("raw",  RAW, 173.0, 24.4),                            # cues 22-31: findings, map, evidence, to verify -> 99.9
    ("raw",  RAW, 225.0, 16.0),                            # cues 32-34: generate PMS, priority actions, HACCP -> 112.5
    ("raw",  RAW, 258.0,  1.9),                            # cue 35: print preview -> 115.8
    ("raw",  RAW, 279.0,  4.0),                            # cue 36: well-run kitchen form -> 119.8
    ("raw",  RAW, 366.0,  8.1),                            # cues 37-40: green banner, findings -> 127.9
    ("png",  "side-by-side.png",           0,     2.0),   # silence 2: both banners -> 129.9
    ("card", "03-architecture.png",        0,    12.8),   # cues 41-44 -> 142.7
    ("card", "04-closing.png",             0,     4.7),   # cues 45-47 -> 148.2
]


def run(args):
    subprocess.run([FFMPEG, "-v", "error", "-y", *args], check=True)


def frame(src, t, out):
    run(["-ss", str(t), "-i", str(src), "-frames:v", "1", str(out)])


def side_by_side(out):
    """Red banner (problem kitchen) next to the green one (well-run kitchen), on the app background."""
    red, green = WORK / "red.png", WORK / "green.png"
    frame(RAW, 163.5, red)
    frame(RAW, 368.0, green)
    # Banner region in the 1280x720 take: the report header column.
    crop = "crop=540:330:370:30,scale=900:550:flags=lanczos"
    run([
        "-i", str(red), "-i", str(green),
        "-filter_complex",
        f"color=c=0x131416:s=1920x1080[bg];[0:v]{crop}[l];[1:v]{crop}[r];"
        "[bg][l]overlay=x=40:y=265[b1];[b1][r]overlay=x=980:y=265,"
        "drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':text='Kitchen with problems':x=40:y=200:fontsize=40:fontcolor=0xeceae4,"
        "drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':text='Well-run kitchen':x=980:y=200:fontsize=40:fontcolor=0xeceae4",
        "-frames:v", "1", str(out),
    ])


def shifted_srt(src, dst):
    """Shifts subtitle cues to account for the inserted silences."""
    def to_s(t):
        h, m, rest = t.split(":"); s, ms = rest.split(",")
        return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
    def fmt(x):
        ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
        return f"{h:02}:{m:02}:{s:02},{ms:03}"
    def shift(x, end=False):
        # A cue ending exactly at a split point stays before the silence.
        return x + sum(d for at, d in SILENCES if (x > at + 0.001 if end else x >= at - 0.001))
    text = src.read_text(encoding="utf8")
    out = re.sub(r"(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)",
                 lambda m: f"{fmt(shift(to_s(m.group(1))))} --> {fmt(shift(to_s(m.group(2)), end=True))}", text)
    dst.write_text(out, encoding="utf8")


def main():
    import sys
    if "--final-only" not in sys.argv:
        if WORK.exists():
            shutil.rmtree(WORK)
        WORK.mkdir(parents=True)
        side_by_side(WORK / "side-by-side.png")

    parts = []
    total = 0.0
    for i, (kind, src, start, dur) in enumerate(SEGMENTS):
        out = WORK / f"{i:02}.mp4"
        if "--final-only" in sys.argv:
            parts.append(out); total += dur; continue
        if kind == "raw":
            run(["-ss", str(start), "-i", str(src), "-t", str(dur), "-vf", RAW_VF, *ENC, str(out)])
        else:
            path = CARDS / src if kind == "card" else WORK / src
            run(["-loop", "1", "-framerate", "30", "-t", str(dur), "-i", str(path), "-vf", "scale=1920:1080,format=yuv420p", *ENC, str(out)])
        parts.append(out)
        total += dur
        print(f"{i:02} {kind:4} {str(src)[-28:]:>28} +{dur:5.1f}s -> {total:6.1f}s")

    concat = WORK / "concat.txt"
    concat.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf8")
    video = WORK / "video.mp4"
    run(["-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(video)])

    # Voice-over with the two silences inserted.
    (a1, d1), (a2, d2) = SILENCES
    audio_fc = (
        f"[1:a]atrim=0:{a1},asetpts=PTS-STARTPTS[v1];"
        f"[1:a]atrim={a1}:{a2},asetpts=PTS-STARTPTS[v2];"
        f"[1:a]atrim={a2},asetpts=PTS-STARTPTS[v3];"
        f"anullsrc=r=24000:cl=mono,atrim=0:{d1}[s1];anullsrc=r=24000:cl=mono,atrim=0:{d2}[s2];"
        "[v1][s1][v2][s2][v3]concat=n=5:v=0:a=1[a]"
    )
    srt = WORK / "subs.srt"
    shifted_srt(SRT, srt)
    srt_path = srt.as_posix().replace(":", "\\:")
    run([
        "-i", str(video), "-i", str(VO),
        "-filter_complex", audio_fc,
        "-map", "0:v", "-map", "[a]",
        "-vf", f"subtitles='{srt_path}':force_style='FontName=Segoe UI,FontSize=22,PrimaryColour=&H00F0F0F0,OutlineColour=&H80000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=48'",
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", "-shortest",
        str(OUT),
    ])
    print("->", OUT)


if __name__ == "__main__":
    main()
