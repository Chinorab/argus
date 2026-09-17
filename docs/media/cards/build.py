"""Renders the video cards (1920x1080 PNG) from HTML with headless Chrome.
   python docs/media/cards/build.py
"""
import base64, os, subprocess, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent.parent
CHROME = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

FONT = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"

BASE_CSS = """
:root { --paper:#131416; --paper-2:#1b1d20; --paper-3:#222428; --ink:#eceae4; --ink-2:#b4b2ab; --ink-3:#7d7c76;
        --line:#2e3035; --accent:#5fb3ad; --accent-soft:#1b3231; --n1:#1f7a3a; --n2:#7cb342; --n3:#e8a317; --n4:#c62828; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { width:1920px; height:1080px; background:var(--paper); color:var(--ink);
  font-family:'Geist', system-ui, sans-serif; -webkit-font-smoothing:antialiased; overflow:hidden; }
.mono { font-family:'Geist Mono', ui-monospace, monospace; }
.ring { display:inline-block; border:9px solid var(--accent); border-radius:50%; }
.kicker { font-family:'Geist Mono', monospace; font-size:22px; letter-spacing:.22em; text-transform:uppercase; color:var(--ink-3); }
.badge { display:inline-block; padding:8px 14px; border-radius:8px; background:var(--paper-3); color:var(--ink-2);
  font-family:'Geist Mono', monospace; font-size:19px; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap; }
.glow { position:absolute; width:900px; height:900px; border-radius:50%; background:var(--accent-soft); filter:blur(160px); opacity:.7; }
"""

def data_uri(path):
    return "data:image/jpeg;base64," + base64.b64encode(open(path, "rb").read()).decode()

def page(body, extra_css=""):
    return f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="{FONT}"><style>{BASE_CSS}{extra_css}</style></head><body>{body}</body></html>"""

CARDS = {}

CARDS["01-title"] = page("""
<div class="glow" style="left:-200px;top:-300px"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 200px;gap:36px">
  <div style="display:flex;align-items:center;gap:22px"><span class="ring" style="width:64px;height:64px"></span>
    <span style="font-size:56px;font-weight:600;letter-spacing:-.02em">Argus</span></div>
  <h1 style="font-size:108px;line-height:1.02;font-weight:600;letter-spacing:-.03em;max-width:1400px">
    The food-safety inspection <span style="color:var(--accent)">before the inspector.</span></h1>
  <p style="font-size:34px;color:var(--ink-2);max-width:1200px;line-height:1.35">Photos, voice notes and temperature logs in. The grade the inspector would publish, out.</p>
  <div style="display:flex;gap:14px;margin-top:20px"><span class="badge">NVIDIA Nemotron 3</span><span class="badge">Nebius Token Factory</span><span class="badge">Open source · Apache 2.0</span></div>
</div>
""")

CARDS["04-closing"] = page("""
<div class="glow" style="right:-300px;bottom:-400px"></div>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center">
  <span class="ring" style="width:110px;height:110px;border-width:14px"></span>
  <h1 style="font-size:120px;font-weight:600;letter-spacing:-.03em">Argus</h1>
  <p style="font-size:38px;color:var(--ink-2);max-width:1300px;line-height:1.35">See your kitchen the way the inspector will — before it matters.</p>
  <div style="margin-top:30px;display:flex;flex-direction:column;gap:14px;font-size:34px" class="mono">
    <span style="color:var(--accent)">argus-eight-xi.vercel.app</span>
    <span style="color:var(--ink-3)">github.com/Chinorab/argus · Apache 2.0</span>
  </div>
  <p style="position:absolute;bottom:56px;font-size:22px;color:var(--ink-3)">Built for the Nebius × NVIDIA Global AI Hackathon · Nemotron 3 Nano, Super and Ultra on Nebius Token Factory</p>
</div>
""")

def node(icon, title, model, tone="paper"):
    bg = "var(--accent-soft)" if tone == "accent" else "var(--paper-2)"
    border = "var(--accent)" if tone == "accent" else "var(--line)"
    return f"""<div style="flex:1;min-width:0;border:2px solid {border};background:{bg};border-radius:22px;padding:30px 32px;display:flex;flex-direction:column;gap:12px">
      <div style="font-size:26px;color:var(--ink-3)">{icon}</div>
      <div style="font-size:34px;font-weight:600;letter-spacing:-.01em">{title}</div>
      <div class="mono" style="font-size:21px;color:var(--ink-2);line-height:1.4">{model}</div></div>"""

ARROW = '<div style="width:56px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--ink-3);font-size:40px">→</div>'

CARDS["03-architecture"] = page(f"""
<div class="glow" style="left:700px;top:-500px;opacity:.45"></div>
<div style="position:absolute;inset:0;padding:110px 120px;display:flex;flex-direction:column;gap:44px">
  <div><div class="kicker">How Argus works</div>
  <h1 style="font-size:64px;font-weight:600;letter-spacing:-.02em;margin-top:14px">Models perceive and extract. <span style="color:var(--accent)">Code decides.</span></h1></div>

  <div style="display:flex;align-items:stretch;gap:0">
    {node("📷 Photos", "Perceive", "MiniCPM-V 4.5 · zone, equipment, anomalies + confidence")}
    {ARROW}
    {node("🎙 Voice notes", "Structure", "Web Speech API → Nemotron 3 Nano 30B · facts", "accent")}
    {ARROW}
    {node("🌡 Temperature logs", "Extract + rules", "Nemotron 3 Nano 30B → rule engine · legal limits, persistent drift", "accent")}
  </div>

  <div style="display:flex;align-items:stretch;gap:0">
    {node("⚖ Case file", "Judge", "Nemotron 3 Ultra 550B (fallback Super 120B) · DGAL grid, EC 852/2004, AM 21/12/2009 · predicted Alim'confiance grade", "accent")}
    {ARROW}
    {node("📄 Report", "Findings with evidence", "one finding per subject · grid point, text, proof, deadline · nothing without evidence")}
    {ARROW}
    {node("🛡 Food safety plan", "Plan", "Nemotron 3 Super 120B · hygiene practices, HACCP + CCPs, records, 30-day actions", "accent")}
  </div>

  <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="display:flex;gap:14px"><span class="badge">All models served by Nebius Token Factory</span><span class="badge">OpenAI-compatible API</span><span class="badge">Server-Sent Events</span></div>
    <div class="mono" style="font-size:22px;color:var(--ink-3);white-space:nowrap">Next.js 16 · TypeScript · zod · Apache 2.0</div>
  </div>
</div>
""")

demo = ROOT / "public" / "demo"
clean = [demo / "clean-cooking-line.jpg", demo / "clean-prep-area.jpg", demo / "clean-pass.jpg"]
problem = [demo / "walk-in-fridge.jpg", demo / "pass-station.jpg", demo / "blast-chiller.jpg"]

def column(title, files, color, label, badges=True):
    imgs = "".join(f'<div style="flex:1;border-radius:18px;overflow:hidden;border:2px solid var(--line)"><img src="{data_uri(f)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>' for f in files)
    badge = f'<span style="background:{color};color:#fff;border-radius:999px;padding:10px 22px;font-size:24px;font-weight:600">{label}</span>' if badges else '<span style="height:48px"></span>'
    return f"""<div style="flex:1;display:flex;flex-direction:column;gap:18px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:36px;font-weight:600">{title}</span>
        {badge}</div>
      <div style="display:flex;gap:18px;height:720px">{imgs}</div></div>"""

for suffix, badges in (("b-verdicts", True), ("a-photos", False)):
    CARDS[f"02{suffix}-two-kitchens"] = page(f"""
<div style="position:absolute;inset:0;padding:70px 90px;display:flex;flex-direction:column;gap:30px">
  <div class="kicker">Two kitchens{", two verdicts" if badges else ""}</div>
  <div style="display:flex;gap:60px;flex:1">
    {column("Well-run kitchen", clean, "var(--n2)", "Satisfactory", badges)}
    {column("Kitchen with problems", problem, "var(--n4)", "Urgent correction", badges)}
  </div>
</div>
""")

for name, html in CARDS.items():
    src = HERE / f"{name}.html"
    out = HERE / f"{name}.png"
    src.write_text(html, encoding="utf8")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--window-size=1920,1080", f"--screenshot={out}", "--virtual-time-budget=6000", src.as_uri()],
                   check=True, capture_output=True)
    print(name, out.stat().st_size, "bytes")
