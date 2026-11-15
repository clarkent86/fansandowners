"""Turn the site's variable WOFF2 fonts into static TTFs that resvg can render (cards + OG image)."""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FS = "node_modules/@fontsource-variable"
jobs = [
    (f"{FS}/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2", "BigShouldersDisplay", [800, 900]),
    (f"{FS}/instrument-sans/files/instrument-sans-latin-wght-normal.woff2", "InstrumentSans", [400, 500, 600]),
]
for src, name, weights in jobs:
    for w in weights:
        f = TTFont(src)
        axes = {"wght": w}
        if "fvar" in f and any(a.axisTag == "wdth" for a in f["fvar"].axes):
            axes["wdth"] = 100
        inst = instantiateVariableFont(f, axes)
        inst.flavor = None
        family = {"BigShouldersDisplay": "Big Shoulders Display", "InstrumentSans": "Instrument Sans"}[name]
        for rec in inst["name"].names:
            if rec.nameID in (1, 16):
                rec.string = family
        out = f"cards/fonts/{name}-{w}.ttf"
        inst.save(out)
        print(out)
