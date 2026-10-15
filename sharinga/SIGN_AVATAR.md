# The 3D Sign Avatar

Sharinga renders a **3D signing avatar in the browser** — free, offline, and
with **no API keys**. It is built with CSS 3D transforms (`perspective` +
`transform-style: preserve-3d`), so it needs no WebGL library and adds no
runtime dependency.

## Where it lives

| File | Role |
| --- | --- |
| `client/src/components/chat/Sign3DAvatar.jsx` | Renders the 3D humanoid, plays the sign sequence, shows captions and controls |
| `client/src/lib/sign3d/poses.js` | Data: `HANDSHAPES`, `SIGNS`, `LETTERS`, `NEUTRAL`, `resolveTokens()` |
| `client/src/index.css` | `.s3d-*` classes (perspective, bones, limb shading, shadow) |

## How it works

1. `resolveTokens(text)` turns a message into tokens.
   - Words found in `SIGNS` become sign tokens with keyframes.
   - Filler words (the, is, to, …) are dropped, like ASL does.
   - Everything else is **fingerspelled** with the simplified alphabet.
2. Each frame is a partial pose merged onto `NEUTRAL`, so a frame only lists
   the joints that actually move.
3. `Sign3DAvatar` plays the frames in order. Bones have a CSS `transition`, so
   the browser interpolates between poses — no animation loop required.
4. Captions and the current word are always shown. Controls: play, pause,
   replay, speed (1×, 1.5×, 0.75×).

## Pose format

```js
{
  lean: [x, y, z],       // torso tilt (degrees)
  head: [x, y, z],
  R: { uf, uo, ut, ef, et, hx, hy, hz, handshape },
  L: { ... },            // same shape as R
}
```

Arm fields (degrees):

| Field | Meaning |
| --- | --- |
| `uf` | upper arm forward (raise in front of the body) |
| `uo` | upper arm out (distance from the side of the body) |
| `ut` | upper arm twist |
| `ef` | forearm bend (elbow) |
| `et` | forearm twist |
| `hx`,`hy`,`hz` | hand / wrist rotation |
| `handshape` | a key from `HANDSHAPES` |

The `S(uf, uo, ef, handshape, extra)` helper builds an arm object compactly.

### Handshapes

Each handshape is a set of finger curls (0 = straight, 1 = curled) plus a
spread: `rest, flat, fist, open5, point, v, w, c, o, pinch, bent, claw, pinky,
l, y, ily`.

## Adding a sign

Edit `SIGNS` in `client/src/lib/sign3d/poses.js`:

```js
THANK: {
  frames: [
    { R: S(18, 10, 98, "flat") },   // hand near the chin
    { R: S(40, 12, 58, "flat") },   // move forward and down
  ],
},
```

Use `repeats: 2` for signs with repeated motion (e.g. waving). Words without an
entry are fingerspelled automatically, so nothing ever "breaks" — an unknown
word is simply spelled out.

## Accessibility

- Honours **reduce motion** (both the OS setting and the in-app toggle):
  poses snap instead of sliding and the timing is compressed.
- The avatar is decorative (`aria-hidden`); the message text is exposed via an
  `aria-live` region, so screen-reader and screen-reader-adjacent flows still work.
- Follows the app theme (shirt uses the brand colour, so it adapts to
  light / dark / high-contrast).

## Honest limitations

The motion is a friendly, recognisable **approximation** of ASL — not certified
interpreting. It is designed as a visual aid *next to* the text, which is the
reliable channel. If you later need true ASL grammar/pose accuracy, the pose
data format is a clean seam: swap `SIGNS` for output from a pose generator
(e.g. a self-hosted `sign-language-translator` "Performs" viewer) without
touching the renderer.
