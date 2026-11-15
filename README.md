# Fans and Owners

A one-page site for the fan petition **[Give Fans a Chance to Own the Future of DC](https://www.change.org/p/let-the-fans-own-dc)**.

The page has three things on it: the petition text (word for word from Change.org), a link to sign, and a live signature counter.
Signatures are collected only on Change.org. This site collects nothing: it has no forms, cookies, or trackers.

## Editing

| What | Where |
|---|---|
| Petition text | `src/pages/index.astro` (keep it identical to the Change.org petition) |
| Petition link, site name | `src/site.config.ts` |
| Look and feel | `src/styles/global.css` |
| Footer disclaimer | `src/components/Footer.astro` |

Please keep the "not an investment / not affiliated" language intact. Any new wording about ownership or money
should match the petition and be reviewed before it goes live.

## Running locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

Built with [Astro](https://astro.build) and plain modern CSS. The built site is static HTML.

## Signature counter

`ops/signatures.py` (Python standard library only) reads the count from the Change.org page and writes
`signatures.json`. The page fetches `/signatures.json` and refreshes it every two minutes. The server runs the
script every 10 minutes:

```sh
SIGNATURES_OUT=/path/to/site/signatures.json python3 ops/signatures.py
```

## Business cards and share image

`npm run cards` renders card mockups, print files, `public/og.png`, and the touch icon (see `cards/render.mjs`).
It needs static fonts first: `python3 cards/make_fonts.py`, which requires `fonttools` and `brotli`.

## Contributing

Open a pull request. Small, focused changes are easiest to review.
