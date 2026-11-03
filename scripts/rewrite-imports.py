#!/usr/bin/env python3
"""
Rewrite the web's `@/…` path aliases and direct image imports for React Native.

The web resolves `@/` to `src/` through a Vite alias and imports images as
modules (`import urgent from "@/img/services/urgent.jpg"`). Metro has no such
alias by default, and `require` needs a literal, so images go through the
generated barrel in `src/assets/images` instead.

Mapping:
    @/config/business  -> ../constants/business   (or ./ from constants/)
    @/lib/X, @/data/X  -> ./X                     (both land in src/lib)
    @/img/a/b.jpg      -> the IMAGES barrel, keyed `aB`

Run after scripts/strip-ts.py, then `npm run verify`.

Usage: rewrite-imports.py FILE [FILE…]
"""
import os
import re
import sys


def image_key(path: str) -> str:
    """`img/services/urgent.jpg` -> `servicesUrgent` — matches the barrel."""
    rel = path.split('img/', 1)[1]
    stem = os.path.splitext(rel)[0]
    parts = re.split(r'[/\-_]+', stem)
    return parts[0] + ''.join(p.capitalize() for p in parts[1:])


def rewrite(path: str) -> None:
    src = open(path, encoding='utf-8').read()
    in_constants = os.sep + 'constants' + os.sep in path

    # 1. image imports -> one barrel import, local names aliased to barrel keys
    image_imports = re.findall(r'^import\s+(\w+)\s+from\s+"(@/img/[^"]+)";?\n', src, re.M)
    if image_imports:
        src = re.sub(r'^import\s+\w+\s+from\s+"@/img/[^"]+";?\n', '', src, flags=re.M)
        aliases = ''.join(
            f'const {name} = IMAGES.{image_key(spec)};\n' for name, spec in image_imports
        )
        barrel = "import { IMAGES } from '../assets/images';\n"
        # place after the final existing import, else at the top
        last = list(re.finditer(r'^import .*?;\n', src, re.M))
        at = last[-1].end() if last else 0
        src = src[:at] + barrel + aliases + src[at:]

    # 2. module aliases
    business = './business' if in_constants else '../constants/business'
    src = src.replace('"@/config/business"', f'"{business}"')
    src = re.sub(r'"@/(?:lib|data)/([\w./-]+)"', r'"./\1"', src)

    open(path, 'w', encoding='utf-8').write(src)
    left = re.findall(r'"@/[^"]+"', src)
    print(f'  {path}' + (f'   UNRESOLVED: {sorted(set(left))}' if left else ''))


if __name__ == '__main__':
    for f in sys.argv[1:]:
        rewrite(f)
