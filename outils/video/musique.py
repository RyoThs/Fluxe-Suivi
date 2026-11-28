# Musique originale de la vidéo (synthétisée ici, aucun morceau d’un autre) : 120 BPM, la mineur.
# Lancer : python3 outils/video/musique.py chemin/musique.wav
import numpy as np, wave
SR = 44100; D = 32.0; N = int(SR * D)
L = np.zeros(N); Rr = np.zeros(N)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)
def add(sig, at, pan=0.0, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig)); s = sig[:j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); Rr[i:j] += s * (1 + min(0, pan))
def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / r)
def note(f): return 440 * 2 ** ((f - 69) / 12)
def kick(g=1):
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * g
def hat():
    n = int(.06 * SR); x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], x]))
    return x * env(n, .001, .018) * .25
def clap():
    n = int(.2 * SR); x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], x]))
    e = np.zeros(n)
    for k in (0, .012, .024): e += np.exp(-np.maximum(0, np.arange(n) / SR - k) * 30) * (np.arange(n) / SR >= k)
    return x * e * .18
def saw(f, n, voices=3, det=.006):
    t = np.arange(n) / SR; out = np.zeros(n)
    for v in range(voices):
        ff = f * (1 + det * (v - (voices - 1) / 2)); ph = (t * ff + rng.random()) % 1
        out += 2 * ph - 1
    return out / voices
def lowpass(x, a):  # filtre simple à un pôle
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def lp_fast(x, k):  # moyenne glissante (plus rapide)
    c = np.cumsum(np.concatenate([[0], x])); return (c[k:] - c[:-k]) / k if k > 1 else x
BEAT = .5; BAR = 2.0
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
ROOTS = [45, 41, 36, 43]
# nappe (pad), présente partout, plus douce pendant l'accroche
for b in range(16):
    at = b * BAR; ch = CHORDS[b % 4]; n = int(BAR * SR) + int(.3 * SR)
    sig = sum(saw(note(m), n, 4, .008) for m in ch) / 3
    sig = lp_fast(np.concatenate([sig, np.zeros(24)]), 24)[:n]
    e = np.minimum(1, np.arange(n) / (.25 * SR)) * np.minimum(1, (n - np.arange(n)) / (.3 * SR))
    g = .10 if at < 3 else (.16 if at < 27 else .12)
    add(sig * e, at, pan=.0, gain=g)
# montée (riser) 0 → 3 s
n = int(3 * SR); x = rng.standard_normal(n); x = lp_fast(np.concatenate([x, np.zeros(8)]), 8)[:n]
add(x * (np.arange(n) / n) ** 2 * .22, 0)
sw = np.sin(2 * np.pi * np.cumsum(200 + 600 * (np.arange(n) / n) ** 2) / SR) * (np.arange(n) / n) ** 2 * .06
add(sw, 0)
# impact à 3 s
add(kick(1.4), 3.0); n = int(1.2 * SR); x = rng.standard_normal(n); add(lp_fast(np.concatenate([x, np.zeros(30)]), 30)[:n] * env(n, .002, .35) * .5, 3.0)
# batterie de 3,5 s à 27,2 s
t = 3.5
while t < 27.2 - 1e-9:
    add(kick(), t)
    if t >= 5.0:
        add(hat(), t + BEAT / 2, pan=.3)
        if int(round((t - 3.5) / BEAT)) % 2 == 1: add(clap(), t, pan=-.1)
    t += BEAT
# basse en croches de 5 s à 27 s
t = 5.0
while t < 27.0 - 1e-9:
    b = int(t // BAR) % 4; n = int(.24 * SR)
    sig = saw(note(ROOTS[b]), n, 2, .003); sig = lp_fast(np.concatenate([sig, np.zeros(40)]), 40)[:n]
    add(sig * env(n, .004, .12), t, gain=.33); t += BEAT / 2
# arpège léger de 13 à 27 s
t = 13.0; k = 0
while t < 27.0 - 1e-9:
    b = int(t // BAR) % 4; m = CHORDS[b][k % 3] + 12 * (1 + (k // 3) % 2); n = int(.2 * SR)
    tt = np.arange(n) / SR; sig = np.sin(2 * np.pi * note(m) * tt) + .3 * np.sin(4 * np.pi * note(m) * tt)
    add(sig * env(n, .003, .09), t, pan=.4 if k % 2 else -.4, gain=.06); t += BEAT / 2; k += 1
# souffles aux changements de rubrique
for at in (12.6, 17.6, 22.1, 26.9):
    n = int(.8 * SR); x = rng.standard_normal(n); x = lp_fast(np.concatenate([x, np.zeros(6)]), 6)[:n]
    e = np.sin(np.pi * np.arange(n) / n) ** 2; add(x * e * .16, at, pan=.0)
# touches sur l'écran
for at in (7.0, 8.6):
    n = int(.05 * SR); tt = np.arange(n) / SR; add(np.sin(2 * np.pi * 1800 * tt) * env(n, .0005, .01) * .35, at)
    add(np.sin(2 * np.pi * 880 * tt[:n]) * env(n, .001, .03) * .15, at + .02)
# compteur des clubs : petits « tic »
for k in range(14):
    at = 23.8 + 1.8 * (1 - (1 - k / 14) ** 0.5); n = int(.02 * SR); tt = np.arange(n) / SR
    add(np.sin(2 * np.pi * 2400 * tt) * env(n, .0005, .006) * .12, at)
# fin : un coup par ligne puis accord final
for at in (27.5, 27.95, 28.4): add(kick(1.1), at); add(clap(), at)
n = int(2.8 * SR)
fin = sum(saw(note(m), n, 4, .006) for m in [57, 60, 64, 69]) / 4
fin = lp_fast(np.concatenate([fin, np.zeros(20)]), 20)[:n] * np.exp(-np.arange(n) / SR / 1.2)
add(fin, 29.2, gain=.35); add(kick(1.3), 29.2)
# mixage : compression douce, fondu final
st = np.stack([L, Rr], 1)
st = np.tanh(st * 1.6) / np.tanh(1.6)
st *= np.minimum(1, (D - t_all) / 1.2)[:, None].clip(0, 1)
st *= .89 / np.abs(st).max()
import sys
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'musique.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', np.abs(st).max())
