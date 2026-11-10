#!/usr/bin/env node
/* Validate the six HTML question banks. This checks structure, NOT historical facts. */
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const paths = [
  'ancient-history.html', 'biology.html', 'historical-geography.html',
  'map-and-flag.html', 'military-history.html', 'recent-history.html'
];
let failures = [], warnings = [], grandTotal = 0, grandSets = 0, tagged = 0, images = 0;
const seen = new Map();
function fail(where, message) { failures.push(where + ': ' + message); }
function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
for (const path of paths) {
  const source = fs.readFileSync(path, 'utf8');
  const found = source.match(/<script id="bank" type="application\/json">([\s\S]*?)<\/script>/);
  if (!found) { fail(path, 'question bank missing'); continue; }
  let papers;
  try { papers = JSON.parse(found[1]); }
  catch (err) { fail(path, 'invalid JSON: ' + err.message); continue; }
  if (!Array.isArray(papers) || !papers.length) { fail(path, 'paper list missing'); continue; }
  const names = new Set();
  let n = 0;
  for (const paper of papers) {
    if (!paper || typeof paper.name !== 'string' || !paper.name.trim() ||
        !Array.isArray(paper.questions) || !paper.questions.length) {
      fail(path, 'invalid paper name or questions'); continue;
    }
    if (names.has(paper.name)) fail(path, 'duplicate paper name: ' + paper.name);
    names.add(paper.name);
    const supplemental = /^Supplemental Practice/i.test(paper.name);
    for (const [index, q] of paper.questions.entries()) {
      const where = path + ' / ' + paper.name + ' / Q' + (index + 1);
      n++;
      if (!q || typeof q.q !== 'string' || !q.q.trim()) { fail(where, 'question text absent'); continue; }
      if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 5 ||
          q.options.some(x => typeof x !== 'string' || !x.trim())) {
        fail(where, 'expected 3–5 nonblank answer options'); continue;
      }
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
        fail(where, 'answer index out of range'); continue;
      }
      // Case matters in scientific notation: BB, Bb and bb are distinct genotypes.
      // A few original source PDFs themselves repeat distractors; do not invent replacements.
      if (new Set(q.options.map(x => x.trim())).size !== q.options.length) {
        if (supplemental) fail(where, 'duplicate answer options');
        else warnings.push(where + ': source/legacy duplicate option — verify against original paper');
      }
      if (q.topic) tagged++;
      if (q.img) images++;
      const k = norm(q.q);
      if (seen.has(k)) fail(where, 'exact text duplicate of ' + seen.get(k));
      else seen.set(k, where);
      if (supplemental) {
        for (const field of ['topic','subtopic','difficulty','sourceRef','explanation']) {
          if (typeof q[field] !== 'string' || !q[field].trim()) fail(where, 'supplement missing ' + field);
        }
        if (q.origin !== 'supplemental' || q.reviewStatus !== 'verified') {
          fail(where, 'supplement must be verified and marked supplemental');
        }
        if (q.img && !q.imgAlt) fail(where, 'image requires accessible alt text');
      }
    }
  }
  // Confirm browser JavaScript parses. This intentionally does not run the DOM.
  const matches = source.matchAll(/<script(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g);
  for (const m of matches) if (m[1].trim()) {
    try { new vm.Script(m[1], {filename:path}); }
    catch (err) { fail(path, 'browser JS syntax: ' + err.message); }
  }
  grandSets += papers.length; grandTotal += n;
  console.log(path.padEnd(26), String(papers.length).padStart(2) + ' sets,', n + ' questions');
}
console.log('TOTAL:', grandSets, 'sets,', grandTotal, 'questions;', tagged, 'topic-tagged;', images, 'image-backed');
warnings.forEach(w => console.warn('WARNING', w));
failures.forEach(f => console.error('ERROR', f));
if (failures.length) { console.error(failures.length + ' validation failure(s)'); process.exit(1); }
console.log('PASS: bank structure and inline script syntax (not source/answer correctness)');
