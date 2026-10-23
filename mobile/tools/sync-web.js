#!/usr/bin/env node
/**
 * Copies web/ into android/app/src/main/assets/web so tools that do not run the
 * Gradle sync task (Android Studio "Run", manual aapt builds) still package the
 * UI. Gradle also does this automatically at build time.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'web');
const dest = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'web');

function copy(from, to) {
  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) {
      if (entry === '.DS_Store') continue;
      copy(path.join(from, entry), path.join(to, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

fs.rmSync(dest, { recursive: true, force: true });
copy(src, dest);

let files = 0, bytes = 0;
(function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else { files++; bytes += st.size; }
  }
})(dest);

console.log(`synced ${files} files (${(bytes / 1024).toFixed(0)} KB) → ${path.relative(root, dest)}`);
