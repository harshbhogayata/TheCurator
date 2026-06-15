#!/usr/bin/env python3
"""Generate short OpenAI TTS samples locally (no openai.fm rate limit).

Usage (from curator-app/api, with OPENAI_API_KEY in .env or environment):

    python scripts/preview_tts_voices.py
    python scripts/preview_tts_voices.py --voices cedar ballad alloy
    python scripts/preview_tts_voices.py --text "Your custom line here."

Outputs MP3 files to assets/voice-samples/ at the repo root.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import requests

OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
DEFAULT_MODEL = "gpt-4o-mini-tts"
DEFAULT_VOICES = ("cedar", "ballad", "alloy", "sage", "coral")
DEFAULT_TEXT = (
    "Good morning. Markets rallied overnight after the Fed signalled patience on rates. "
    "In London, the Bank of England held steady. "
    "Here is your Curator brief — the story, distilled."
)

REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = REPO_ROOT / "assets" / "voice-samples"


def load_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if key:
        return key

    env_file = Path(__file__).resolve().parents[1] / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("OPENAI_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")

    print("Set OPENAI_API_KEY in curator-app/api/.env or your environment.", file=sys.stderr)
    sys.exit(1)


def synthesize(text: str, *, voice: str, model: str, api_key: str) -> bytes:
    response = requests.post(
        OPENAI_TTS_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "voice": voice,
            "input": text,
            "response_format": "mp3",
        },
        timeout=120,
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"{voice}: API {response.status_code} — {response.text[:300]}"
        )
    return response.content


def main() -> None:
    parser = argparse.ArgumentParser(description="Preview OpenAI TTS voices locally.")
    parser.add_argument(
        "--voices",
        nargs="+",
        default=list(DEFAULT_VOICES),
        help=f"Voices to render (default: {' '.join(DEFAULT_VOICES)})",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--text", default=DEFAULT_TEXT)
    parser.add_argument(
        "--out",
        type=Path,
        default=OUTPUT_DIR,
        help="Output directory for MP3 files",
    )
    args = parser.parse_args()

    api_key = load_api_key()
    args.out.mkdir(parents=True, exist_ok=True)

    print(f"Model: {args.model}")
    print(f"Output: {args.out}\n")

    for voice in args.voices:
        out_path = args.out / f"{voice}.mp3"
        print(f"  {voice} … ", end="", flush=True)
        try:
            mp3 = synthesize(args.text, voice=voice, model=args.model, api_key=api_key)
        except RuntimeError as exc:
            print(f"FAILED — {exc}")
            continue
        out_path.write_bytes(mp3)
        print(f"OK → {out_path.name}")

    print("\nOpen the MP3s in assets/voice-samples/ and compare side by side.")


if __name__ == "__main__":
    main()
