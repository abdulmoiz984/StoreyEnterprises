#!/usr/bin/env python3
"""
Strip TypeScript from a .ts module, line by line, for porting web source to
plain-JavaScript React Native.

Lessons baked in from earlier ports — do not "simplify" these away:

1. A WHOLE-FILE regex is unsafe. A pattern for a single-line
   `export type X = {...};` once matched a `\\n};` hundreds of lines later and
   silently deleted three declarations in between. This walks line by line and
   tracks brace depth, so a multi-line type block ends where it really ends.

2. Parameter annotations need BRACKET-AWARE splitting: `(pairs: [string,
   string][])` contains a comma inside the type.

3. `const x: { a?: string } = {}` is object-literal-led, not identifier-led.
   An earlier version only matched `: Identifier`, left these behind, and
   @react-native/babel-preset compiled them anyway (its TS plugin tolerates TS
   in .js) — so only a parser-based check caught them. Handled below.

4. Optional parameters `fn(a, b?)` are likewise invalid JS and likewise
   survive babel. Handled below.

5. `as Type` cannot be a regex either — `as Shipment["deliveryType"]` has a
   quoted string inside brackets, and a character class cannot span it. Scanned
   with balanced delimiters instead; see strip_as_casts.

ALWAYS run `npm run verify` after using this; babel alone will not catch 3 or 4.

Usage: strip-ts.py in.ts out.js
"""
import re
import sys


def strip_params(sig: str) -> str:
    """Remove `: Type` annotations from a parameter list, bracket-aware."""
    out, depth, i = [], 0, 0
    while i < len(sig):
        c = sig[i]
        if c in '([{<':
            depth += 1
            out.append(c)
        elif c in ')]}>':
            depth -= 1
            out.append(c)
        elif c == ':' and depth == 1:
            j, d2 = i + 1, 0
            while j < len(sig):
                c2 = sig[j]
                if c2 in '([{<':
                    d2 += 1
                elif c2 in ')]}>':
                    if d2 == 0:
                        break
                    d2 -= 1
                elif c2 == ',' and d2 == 0:
                    break
                j += 1
            i = j
            continue
        else:
            out.append(c)
        i += 1
    return ''.join(out)


def strip_value_annotation(line: str) -> str:
    """`const x: {...} = …` / `const x: T = …` -> `const x = …`.

    Walks from the colon and balances {}[]()<> so an object-literal type with
    its own braces and semicolons is removed whole (lesson 3).
    """
    m = re.search(r'\b(const|let|var)\s+(\w+)\s*:', line)
    if not m:
        return line
    i = m.end()
    depth = 0
    while i < len(line):
        c = line[i]
        if c in '{[(<':
            depth += 1
        elif c in '}])>':
            depth -= 1
        elif c == '=' and depth == 0:
            break
        i += 1
    if i >= len(line):
        return line
    return f'{line[:m.end() - 1]} {line[i:]}'


def main(src_path: str, out_path: str) -> None:
    lines = open(src_path, encoding='utf-8').read().split('\n')
    out, i, dropped = [], 0, []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if re.match(r'^import\s+type\s', stripped):
            while i < len(lines) and ';' not in lines[i]:
                i += 1
            i += 1
            continue

        # `export type X` AND bare `type X` / `interface X` — the web only
        # exports the ones other modules import; the rest are local and were
        # surviving into the output as stray object literals.
        m = re.match(r'^(?:export\s+)?(type|interface)\s+(\w+)', stripped)
        if m:
            dropped.append(m.group(2))
            depth = line.count('{') - line.count('}')
            ends = ';' in line and depth <= 0
            i += 1
            while i < len(lines) and not ends:
                depth += lines[i].count('{') - lines[i].count('}')
                if depth <= 0 and (lines[i].rstrip().endswith(';') or lines[i].strip() in ('}', '};')):
                    ends = True
                i += 1
            continue

        out.append(line)
        i += 1

    text = '\n'.join(out)

    # Function signatures, MULTI-LINE aware. A parameter can carry an inline
    # object type that spans lines and contains its own braces and semicolons:
    #     export function buildPrice(input: {
    #       serviceId: string;
    #     }) { ... }
    # so the signature cannot be matched with `\([^{;]*\)`. Balance the parens
    # from each `function NAME(` instead.
    def rewrite_signatures(src: str) -> str:
        out, i = [], 0
        for m in re.finditer(r'\bfunction\s+\w*\s*\(', src):
            start = m.end() - 1
            depth, j = 0, start
            while j < len(src):
                if src[j] in '([{':
                    depth += 1
                elif src[j] in ')]}':
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            if j >= len(src):
                continue
            sig = src[start:j + 1]
            # a return annotation sits between ')' and the opening '{'
            k = j + 1
            while k < len(src) and src[k] not in '{;':
                k += 1
            tail = ' {' if k < len(src) and src[k] == '{' else src[j + 1:k]
            out.append(src[i:start])
            out.append(strip_params(sig.replace('\n', ' ')))
            out.append(tail)
            i = k + 1 if tail == ' {' else k
        out.append(src[i:])
        return ''.join(out)

    # Generic type PARAMETERS on a declaration: `function loadJson<T>(raw)`.
    # Must run BEFORE rewrite_signatures, whose `function NAME(` anchor does
    # not expect anything between the name and the paren.
    text = re.sub(
        r'\bfunction\s+(\w+)\s*<(?:[^<>()]|<[^<>()]*>)*>\s*\(', r'function \1(', text
    )

    text = rewrite_signatures(text)

    # Value annotations, MULTI-LINE aware for the same reason as signatures:
    #     export const DELIVERY_TYPES: Array<{
    #       id: DeliveryType;
    #     }> = [ ... ]
    # Balance <>{}[]() from the colon to the top-level '=' and drop the middle.
    def rewrite_value_annotations(src: str) -> str:
        out, i = [], 0
        for m in re.finditer(r'\b(?:const|let|var)\s+\w+\s*:', src):
            colon = m.end() - 1
            depth, j = 0, colon + 1
            while j < len(src):
                c = src[j]
                if c in '{[(<':
                    depth += 1
                elif c in '}])>':
                    depth -= 1
                elif c == '=' and depth == 0:
                    break
                elif c in ';\n' and depth == 0:
                    j = -1
                    break
                j += 1
            if j <= 0 or j >= len(src):
                continue
            out.append(src[i:colon])
            out.append(' ')
            i = j
        out.append(src[i:])
        return ''.join(out)

    text = rewrite_value_annotations(text)
    text = re.sub(
        r'(\()([^()=;{}]*:[^()=;{}]*)(\)\s*(?::\s*[^=]+?)?\s*=>)',
        lambda m: strip_params('(' + m.group(2) + ')')[:-1] + ') =>',
        text,
    )

    # lesson 4 — optional params
    text = re.sub(r'(\(\s*[^()]*?)\b(\w+)\?(\s*[,)])', r'\1\2\3', text)

    # Inline `type` specifiers inside a value import:
    #     import { useState, type ReactNode } from "react"
    def drop_type_specifiers(m):
        names = [n.strip() for n in m.group(1).split(',')]
        kept = [n for n in names if n and not re.match(r'^type\s', n)]
        return 'import {' + (' ' + ', '.join(kept) + ' ' if kept else '') + '} from'
    text = re.sub(r'import\s*\{([^}]*)\}\s*from', drop_type_specifiers, text)

    # Generic type ARGUMENTS on a call: `useState<Shipment[]>(seed.shipments)`.
    # Requiring the generic body to contain no parentheses keeps this from
    # eating ordinary comparisons such as `a < b > (c)`.
    text = re.sub(r'\b(\w+)<(?:[^<>()]|<[^<>()]*>)*>\(', r'\1(', text)

    text = re.sub(r'\s+as\s+const\b', '', text)

    # `as SomeType` — SCANNED, not regexed. Lesson 5: a cast's type can be an
    # indexed access with a quoted key (`as Shipment["deliveryType"]`), a
    # generic, a union, or a nesting of all three, and no character class can
    # span a quoted string. The old regex ate `as Shipment[` and left
    # `"deliveryType"]` behind — valid-looking garbage that babel then choked
    # on. Consume a BALANCED type expression instead and drop the whole thing.
    def strip_as_casts(src: str) -> str:
        out, i = [], 0
        for m in re.finditer(r'\s+as\s+(?=[A-Za-z_{(\[])', src):
            if m.start() < i:
                continue  # inside a cast already consumed
            j, depth = m.end(), 0
            while j < len(src):
                c = src[j]
                if c in '<[({':
                    depth += 1
                elif c in '>])}':
                    if depth == 0:
                        break
                    depth -= 1
                elif c in '"\'':
                    quote, j = c, j + 1
                    while j < len(src) and src[j] != quote:
                        j += 2 if src[j] == '\\' else 1
                elif depth == 0 and (c in ',;\n' or (c == '=' and src[j:j + 2] != '=>')):
                    break
                j += 1
            out.append(src[i:m.start()])
            i = j
        out.append(src[i:])
        return ''.join(out)

    text = strip_as_casts(text)

    text = re.sub(r'\s+satisfies\s+[A-Za-z_][\w.<>\[\]|]*', '', text)
    text = text.replace('!.', '.')

    open(out_path, 'w', encoding='utf-8').write(text)
    print(f'wrote {out_path}')
    if dropped:
        print('dropped type decls:', ', '.join(dropped))
    print('NOW RUN: npm run verify  (babel will not catch leftover TS in .js)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
