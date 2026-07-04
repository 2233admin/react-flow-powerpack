#!/usr/bin/env node
import { rmSync } from "node:fs"
import path from "node:path"

const targets = process.argv.slice(2)

if (targets.length === 0) {
  process.stderr.write("Usage: node scripts/clean.mjs <path> [...path]\n")
  process.exit(1)
}

for (const target of targets) {
  const resolved = path.resolve(target)
  rmSync(resolved, { recursive: true, force: true })
}
