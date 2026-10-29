"""
Aquar.io sound effects, synthesized from scratch (no samples, no licenses to track).

Every sound is short, soft and built from the same ocean palette: water drops, bubbles,
a marimba-like chime tuned to a pentatonic scale, and a low swell. Run:

    python3 scripts/sounds/make_sounds.py <out-dir>

It writes one 44.1 kHz mono WAV per sound; convert to MP3 for the app with ffmpeg.
"""

import sys
import wave
from pathlib import Path

import numpy as np

RATE = 44_100
rng = np.random.default_rng(7)  # fixed seed: the same files every run


def t(seconds: float) -> np.ndarray:
    return np.arange(int(RATE * seconds)) / RATE


def env(length: int, attack: float, decay: float) -> np.ndarray:
    """Fast attack, exponential decay (seconds)."""
    x = np.arange(length) / RATE
    a = np.clip(x / max(attack, 1e-4), 0, 1)
    return a * np.exp(-x / decay)


def glide(f0: float, f1: float, seconds: float, curve: float = 3.0) -> np.ndarray:
    """A sine whose pitch slides from f0 to f1 (exponential), as a water drop does."""
    x = t(seconds)
    k = np.exp(-curve * x / seconds)
    freq = f1 + (f0 - f1) * k
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    return np.sin(phase)


def drop(f0=1400, f1=520, seconds=0.12, decay=0.035, level=0.8) -> np.ndarray:
    s = glide(f0, f1, seconds, 4.0)
    return level * s * env(len(s), 0.002, decay)


def bubble(f0, seconds=0.09, level=0.5) -> np.ndarray:
    """A bubble: pitch rises as it shrinks."""
    s = glide(f0, f0 * 1.9, seconds, 2.0)
    return level * s * env(len(s), 0.004, seconds / 3)


def marimba(freq: float, seconds=0.9, level=0.5) -> np.ndarray:
    """A soft mallet note: fundamental plus a quiet 4th harmonic that dies fast."""
    x = t(seconds)
    body = np.sin(2 * np.pi * freq * x) * np.exp(-x / 0.35)
    knock = 0.25 * np.sin(2 * np.pi * freq * 4 * x) * np.exp(-x / 0.04)
    s = body + knock
    return level * s * np.clip(x / 0.003, 0, 1)


def swell(seconds: float, level=0.12, cutoff=0.002) -> np.ndarray:
    """Soft filtered noise rising and falling, like a small wave."""
    n = int(RATE * seconds)
    noise = rng.standard_normal(n)
    # One-pole low-pass, run twice: the hiss becomes a wash.
    for _ in range(2):
        out = np.empty(n)
        acc = 0.0
        for i in range(n):
            acc += cutoff * 20 * (noise[i] - acc)
            out[i] = acc
        noise = out
    shape = np.sin(np.pi * np.arange(n) / n) ** 2
    s = noise * shape
    return level * s / (np.abs(s).max() + 1e-9)


def mix(length_s: float, *parts: tuple[float, np.ndarray]) -> np.ndarray:
    out = np.zeros(int(RATE * length_s))
    for start, sig in parts:
        i = int(start * RATE)
        end = min(len(out), i + len(sig))
        out[i:end] += sig[: end - i]
    return out


def finish(s: np.ndarray, peak=0.7) -> np.ndarray:
    fade = min(len(s), int(0.02 * RATE))
    s = s.copy()
    s[-fade:] *= np.linspace(1, 0, fade)
    return peak * s / (np.abs(s).max() + 1e-9)


# Pentatonic notes (C major pentatonic, around C5): calm and never dissonant together.
C5, D5, E5, G5, A5, C6 = 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5

SOUNDS = {
    # Checking a task: one clear water drop.
    "task": lambda: finish(drop(), 0.6),
    # A habit done: a drop and two rising bubbles (the creature breathing).
    "habit": lambda: finish(
        mix(0.35, (0, drop(1300, 560)), (0.07, bubble(700)), (0.14, bubble(950, level=0.4))),
        0.6,
    ),
    # A routine step: a smaller, softer drop.
    "step": lambda: finish(drop(1700, 900, 0.09, 0.025, 0.6), 0.45),
    # Something placed in a routine or habit (Conectar): a soft knock and a bubble.
    "connect": lambda: finish(
        mix(0.3, (0, marimba(G5, 0.25, 0.5)), (0.05, bubble(600, level=0.35))), 0.55
    ),
    # A list finished or a routine complete: three rising chime notes.
    "complete": lambda: finish(
        mix(1.2, (0, marimba(C5)), (0.11, marimba(E5)), (0.22, marimba(G5, 1.0))), 0.6
    ),
    # Full tide (everything planned for today done): arpeggio over a small wave.
    "full-tide": lambda: finish(
        mix(
            2.2,
            (0, swell(2.0, 0.5)),
            (0.15, marimba(C5)),
            (0.27, marimba(E5)),
            (0.39, marimba(G5)),
            (0.51, marimba(C6, 1.4, 0.45)),
            (0.53, marimba(A5, 1.4, 0.25)),
        ),
        0.65,
    ),
    # A new depth zone: a slow low glide down and a far sonar ping.
    "zone": lambda: finish(
        mix(
            2.6,
            (0, 0.35 * glide(220, 110, 2.2, 1.5) * env(int(2.2 * RATE), 0.4, 1.2)),
            (0, swell(2.4, 0.4, 0.0012)),
            (1.1, marimba(D5 * 2, 1.4, 0.3)),
        ),
        0.6,
    ),
    # A habit timer reaching its goal: two gentle bells.
    "timer": lambda: finish(mix(1.3, (0, marimba(G5, 0.9)), (0.35, marimba(C6, 0.95))), 0.6),
}


def write(path: Path, signal: np.ndarray) -> None:
    pcm = (np.clip(signal, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(pcm.tobytes())


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "assets/sounds")
    out.mkdir(parents=True, exist_ok=True)
    for name, make in SOUNDS.items():
        write(out / f"{name}.wav", make())
        print(name)
