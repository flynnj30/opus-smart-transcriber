from pathlib import Path
import re

ROOT = Path(__file__).parent.parent
assert (ROOT / "index.html").exists()
assert (ROOT / "js" / "smart-opus-transcriber.js").exists()
assert (ROOT / "js" / "app.js").exists()
assert (ROOT / "css" / "style.css").exists()

html = (ROOT / "index.html").read_text(encoding="utf-8")
engine = (ROOT / "js" / "smart-opus-transcriber.js").read_text(encoding="utf-8")
app = (ROOT / "js" / "app.js").read_text(encoding="utf-8")

for forbidden in ["puter.ai", "huggingface.co", "/transcribe", "google/gemini", "faster-whisper"]:
    assert forbidden not in html.lower() + engine.lower() + app.lower(), forbidden

assert "SmartOpusTranscriber.transcribe" in app
assert "responseText" not in app
print("Standalone structural tests: PASS")
