#!/usr/bin/env node
/**
 * Static sweep over src/ that the bundler cannot do for us.
 *
 *   1. every file parses
 *   2. every relative import resolves to a real file
 *   3. every *named* import exists in the target's exports, following
 *      `export * from` through barrels
 *   4. every navigation target is registered AND reachable from where it is
 *      called — a tab is not addressable from a stack screen
 *   5. every Icon `name` is a real Lucide glyph
 *   6. every palette reference resolves, and no file hardcodes a hex colour
 *   7. no web-only global (import.meta, localStorage, window.*) is used
 *
 * Metro only proves 1 and 2 — a missing named export is `undefined` at
 * runtime, and a bad route or glyph name only shows up when you open the
 * screen. Run with `node scripts/verify.js`.
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const EXTS = ['.js', '.jsx', '.json'];

const problems = [];
const fail = (file, msg) => problems.push(`${path.relative(ROOT, file)}: ${msg}`);

/* ------------------------------------------------------------------ files */

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js') || e.name.endsWith('.jsx')) out.push(p);
  }
  return out;
}

const files = [...walk(SRC), path.join(ROOT, 'App.js'), path.join(ROOT, 'index.js')].filter(f =>
  fs.existsSync(f),
);

/* ----------------------------------------------------------------- parsing */

const asts = new Map();
for (const f of files) {
  try {
    asts.set(
      f,
      parser.parse(fs.readFileSync(f, 'utf8'), {
        sourceType: 'module',
        plugins: ['jsx', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator'],
      }),
    );
  } catch (e) {
    fail(f, `parse error — ${e.message}`);
  }
}

/* --------------------------------------------------------------- resolving */

function resolve(fromFile, spec) {
  if (!spec.startsWith('.')) return null; // package; Metro's problem
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const c of [base, ...EXTS.map(e => base + e), ...EXTS.map(e => path.join(base, 'index' + e))]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return undefined; // unresolvable
}

/* ----------------------------------------------------------------- exports */

const exportCache = new Map();

function exportsOf(file, seen = new Set()) {
  if (exportCache.has(file)) return exportCache.get(file);
  if (seen.has(file)) return new Set();
  seen.add(file);

  const names = new Set();
  const ast = asts.get(file);
  if (!ast) {
    // .json or unparsed — assume anything goes rather than cry wolf
    exportCache.set(file, null);
    return null;
  }

  for (const node of ast.program.body) {
    if (node.type === 'ExportDefaultDeclaration') names.add('default');
    else if (node.type === 'ExportNamedDeclaration') {
      for (const s of node.specifiers || []) names.add(s.exported.name);
      const d = node.declaration;
      if (!d) continue;
      if (d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') names.add(d.id.name);
      if (d.type === 'VariableDeclaration') {
        for (const decl of d.declarations) {
          // `export const Foo = …`
          if (decl.id.type === 'Identifier') names.add(decl.id.name);
          // `export const { a, b } = slice.actions`
          if (decl.id.type === 'ObjectPattern') {
            for (const p of decl.id.properties) {
              if (p.type === 'ObjectProperty' && p.value.type === 'Identifier') names.add(p.value.name);
              else if (p.type === 'RestElement' && p.argument.type === 'Identifier') names.add(p.argument.name);
            }
          }
        }
      }
    } else if (node.type === 'ExportAllDeclaration') {
      const target = resolve(file, node.source.value);
      if (target) {
        const sub = exportsOf(target, seen);
        if (sub === null) {
          exportCache.set(file, null); // opaque re-export, give up cleanly
          return null;
        }
        for (const n of sub) if (n !== 'default') names.add(n);
      } else if (target === undefined) {
        fail(file, `export * from unresolvable '${node.source.value}'`);
      }
    }
  }
  exportCache.set(file, names);
  return names;
}

/* ----------------------------------------------------- imports: 2 + 3 */

for (const [file, ast] of asts) {
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;
    const spec = node.source.value;
    const target = resolve(file, spec);
    if (target === null) continue; // package
    if (target === undefined) {
      fail(file, `cannot resolve '${spec}'`);
      continue;
    }
    const available = exportsOf(target);
    if (available === null) continue;
    for (const s of node.specifiers) {
      const want = s.type === 'ImportDefaultSpecifier' ? 'default' : s.type === 'ImportSpecifier' ? s.imported.name : null;
      if (want && !available.has(want)) {
        fail(file, `'${spec}' has no export '${want}'`);
      }
    }
  }
}

/* -------------------------------------------------------- routes: 4 */

const navFile = path.join(SRC, 'navigation', 'StackNavigator.js');

// Stack routes and TAB routes are tracked separately, and that separation is
// the whole point. A tab lives inside the `Tabs` navigator, so a stack screen
// calling `navigation.navigate('Home')` fails at runtime with "The action
// 'NAVIGATE' ... was not handled by any navigator" and the screen just does not
// move. An earlier version of this check merged both into one set, so every one
// of those calls looked valid and ten of them shipped.
const stackRoutes = new Set();
const tabRoutes = new Set();
for (const f of [navFile, path.join(SRC, 'navigation', 'RootStack.js')]) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/<Stack\.Screen\s+name="([^"]+)"/g)) stackRoutes.add(m[1]);
  for (const m of src.matchAll(/<Tab\.Screen\s+name="([^"]+)"/g)) tabRoutes.add(m[1]);
}
const routes = new Set([...stackRoutes, ...tabRoutes]);

if (routes.size === 0) problems.push('no routes found — the route scan needs updating');

// The tab list the `goTo` helper switches on must match the navigator exactly,
// or a tab added later silently goes back to the broken direct form.
const routesFile = path.join(SRC, 'navigation', 'routes.js');
if (fs.existsSync(routesFile) && tabRoutes.size) {
  const declared = new Set(
    [...fs.readFileSync(routesFile, 'utf8').matchAll(/'([A-Z][A-Za-z]*)'/g)].map(m => m[1]),
  );
  for (const name of tabRoutes) {
    if (!declared.has(name)) fail(routesFile, `TAB_ROUTES is missing the tab '${name}'`);
  }
}

/** Drop comments, so prose that QUOTES a bad call is not read as one. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

for (const [file, ast] of asts) {
  const src = stripComments(fs.readFileSync(file, 'utf8'));
  // `replace` is qualified: a bare `.replace('…')` is almost always String#replace.
  for (const m of src.matchAll(/\.(?:navigate|push)\(\s*'([^']+)'|\bnavigation\.replace\(\s*'([^']+)'/g)) {
    const name = m[1] || m[2];
    if (tabRoutes.has(name) && !stackRoutes.has(name)) {
      fail(file, `navigates directly to the tab route '${name}' — use goTo() from navigation/routes`);
    } else if (!routes.has(name)) {
      fail(file, `navigates to unregistered route '${name}'`);
    }
  }
  // goTo() targets must still be real routes.
  for (const m of src.matchAll(/\bgoTo\(\s*navigation\s*,\s*'([^']+)'/g)) {
    if (!routes.has(m[1])) fail(file, `goTo() targets unregistered route '${m[1]}'`);
  }
  for (const m of src.matchAll(/name:\s*'([A-Z][A-Za-z]*Screen)'/g)) {
    if (!routes.has(m[1])) fail(file, `reset/route object names unregistered route '${m[1]}'`);
  }
}

/* --------------------------------------------------------- glyphs: 5 */

const glyphs = new Set(Object.keys(require('@react-native-vector-icons/lucide/glyphmaps/Lucide.json')));

// A glyph name reaches the icon component three ways in this port, and all
// three have to be covered — an earlier version only matched `<Icon name=`,
// which this project never writes, so the whole check silently passed on
// everything. A wrong name renders a blank box, never an error.
const GLYPH_PATTERNS = [
  //   <Lucide name="chevron-left" />   (also <Icon …>, if that spelling returns)
  /<(?:Lucide|Icon)\b[^>]*?\sname=["']([a-z][a-z0-9-]*)["']/g,
  //   icon: 'truck'   /   icon="truck"
  /\bicon:\s*["']([a-z][a-z0-9-]*)["']|\bicon=["']([a-z][a-z0-9-]*)["']/g,
  //   name={SERVICE_ICONS[id] ?? 'package'}  — the inline fallback
  /\?\?\s*['"]([a-z][a-z0-9-]*)['"]\s*\}/g,
];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  for (const pattern of GLYPH_PATTERNS) {
    for (const m of src.matchAll(pattern)) {
      const name = m[1] || m[2];
      if (name && !glyphs.has(name)) fail(file, `unknown Lucide glyph '${name}'`);
    }
  }
  // Icon LOOKUP TABLES: `const SERVICE_ICONS = { '01': 'calendar', … }`. The
  // values never appear next to a `name=`, so no pattern above sees them.
  for (const table of src.matchAll(/(?:_ICONS|_GLYPHS|Icons)\s*=\s*\{([^}]*)\}/g)) {
    for (const m of table[1].matchAll(/:\s*['"]([a-z][a-z0-9-]*)['"]/g)) {
      if (!glyphs.has(m[1])) fail(file, `unknown Lucide glyph '${m[1]}' in an icon table`);
    }
  }
}


/* --------------------------------------------------------- palette: 6 */

// Every `colors.X` must exist in the palette. A typo resolves to `undefined`
// and paints nothing — invisible text rather than a crash. This project is
// light-only; if a DARK palette is ever added, extend this to a parity check
// between the two (a token in one and not the other is the same silent bug).
const tokensPath = path.join(SRC, 'globalStyle', 'tokens.js');
if (fs.existsSync(tokensPath)) {
  const tokenSrc = fs.readFileSync(tokensPath, 'utf8');
  const i = tokenSrc.indexOf('export const LIGHT = {');
  const j = tokenSrc.indexOf('\n};', i);
  const palette = new Set([...tokenSrc.slice(i, j).matchAll(/^\s{2}(\w+):/gm)].map(m => m[1]));
  // Gradient takes a `colors` ARRAY prop, so array members are not tokens.
  const notTokens = new Set(['map', 'length', 'filter', 'forEach', 'slice', 'join']);
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    // The palette is imported under a per-file alias — `import { LIGHT as c }`
    // is what this port writes, and the previous version only knew the name
    // `colors`, so it checked nothing. Read the alias out of the import rather
    // than guessing it, so a bare `c.foo` in some unrelated file is not
    // mistaken for a token reference.
    const aliases = new Set(['colors']);
    for (const m of src.matchAll(/import\s*\{[^}]*\bLIGHT\s+as\s+(\w+)/g)) aliases.add(m[1]);
    for (const m of src.matchAll(/import\s*\{[^}]*\b(LIGHT)\b\s*[,}]/g)) aliases.add(m[1]);
    for (const alias of aliases) {
      for (const m of src.matchAll(new RegExp(`\\b${alias}\\.(\\w+)`, 'g'))) {
        if (!notTokens.has(m[1]) && !palette.has(m[1])) {
          fail(file, `'${alias}.${m[1]}' is not in the palette`);
        }
      }
    }
    // A raw hex colour in a screen or component means a token was bypassed.
    // tokens.js itself is where they are allowed to live.
    if (!file.endsWith(path.join('globalStyle', 'tokens.js'))) {
      for (const m of src.matchAll(/(['"])(#[0-9a-fA-F]{3,8})\1/g)) {
        fail(file, `hardcoded colour ${m[2]} — add it to the palette instead`);
      }
    }
  }
}

/* ------------------------------------------------- web-only globals: 7 */

// Constructs Metro happily bundles in dev but that do not exist in React
// Native — and that Hermes REJECTS outright when it compiles ahead of time for
// a Release build. `import.meta` is fatal; the rest crash at runtime. A debug
// build gives no warning for any of them, so they only surface at archive time.
const WEB_ONLY = [
  [/\bimport\.meta\b/, 'import.meta (Vite-only; fatal to Hermes in Release)'],
  [/\blocalStorage\b/, 'localStorage'],
  [/\bsessionStorage\b/, 'sessionStorage'],
  [/\bdocument\s*\./, 'document.*'],
  [/\bwindow\s*\./, 'window.*'],
  [/\bnavigator\s*\./, 'navigator.*'],
  [/\bcrypto\.(subtle|randomUUID)\b/, 'Web Crypto'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bMediaRecorder\b/, 'MediaRecorder'],
  [/URL\.createObjectURL/, 'URL.createObjectURL'],
];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // Strip comments before matching: a `//` tail, a whole-line `/* … */`, and
    // block-comment bodies (` * …`) and openers (`/** …`). Several of these
    // patterns are legitimately NAMED in comments explaining what was replaced.
    if (/^\s*(\*|\/\*)/.test(line)) return;
    // Strip comments AND string literals before matching. Without the string
    // strip, ordinary prose trips this: a courier app says "pickup window."
    // and "delivery window." constantly, and `\bwindow\.` happily matches the
    // word plus the full stop that ends the sentence.
    const code = line
      .replace(/\/\*.*?\*\//g, '')
      .replace(/\/\/.*$/, '')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\]|\\.)*`/g, '``');
    for (const [pattern, label] of WEB_ONLY) {
      if (pattern.test(code)) fail(file, `line ${i + 1}: ${label} is not available in React Native`);
    }
  });
}

/* ------------------------------------------------------------------ report */

console.log(`checked ${files.length} files, ${routes.size} routes, ${glyphs.size} glyphs, palette, web-globals`);
if (problems.length === 0) {
  console.log('ALL CLEAR');
  process.exit(0);
}
console.log(`\n${problems.length} problem(s):`);
for (const p of problems) console.log('  ' + p);
process.exit(1);
