/* Canadian Championship Exams — local-first study log. No account, server, or analytics. */
(function () {
  'use strict';
  var STORAGE_KEY = 'championship-progress-v1';
  var MAX_ATTEMPTS = 250;
  function empty() { return { version: 1, questions: {}, attempts: [] }; }
  function read() {
    try {
      var x = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (x && x.version === 1 && x.questions && Array.isArray(x.attempts)) return x;
    } catch (e) { console.warn('Could not read progress', e); }
    return empty();
  }
  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
    catch (e) { console.warn('Could not save progress', e); return false; }
  }
  // Stable within a source paper even when its questions are shuffled.
  function questionId(subject, paper, q) {
    var s = subject + '|' + paper + '|' + q.q;
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 'q' + (h >>> 0).toString(36);
  }
  function record(run) {
    if (!run || !Array.isArray(run.questions) || !run.questions.length) return false;
    var db = read(), responses = [], a = run.answers || {};
    run.questions.forEach(function (q, i) {
      var id = questionId(run.subject, run.paper, q);
      db.questions[id] = {
        subject: run.subject, paper: run.paper, text: String(q.q),
        options: q.options.slice(), answer: q.answer, topic: q.topic || ''
      };
      var answered = Object.prototype.hasOwnProperty.call(a, i);
      responses.push({
        id: id, position: i + 1, choice: answered ? a[i] : null,
        outcome: !answered ? 'blank' : (a[i] === q.answer ? 'correct' : 'wrong')
      });
    });
    db.attempts.push({
      id: 'a' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
      at: new Date().toISOString(),
      subject: run.subject, paper: run.paper, mode: run.mode,
      questionCount: run.questions.length, correct: run.correct, wrong: run.wrong,
      blank: run.blank, score: run.score, maxScore: 2 * run.questions.length,
      elapsedSeconds: Math.max(0, Math.round((Date.now() - run.startedAt) / 1000)),
      responses: responses
    });
    if (db.attempts.length > MAX_ATTEMPTS) db.attempts = db.attempts.slice(-MAX_ATTEMPTS);
    return save(db);
  }
  function download(name, type, contents) {
    var blob = new Blob([contents], { type: type });
    var url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click();
    link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportJSON() {
    download('championship-progress-' + new Date().toISOString().slice(0, 10) + '.json',
      'application/json', JSON.stringify(read(), null, 2));
  }
  function csvCell(value) {
    var s = value === undefined || value === null ? '' : String(value);
    // Prevent spreadsheet-formula execution when CSV is opened in Excel.
    if (/^[\s]*[=+@]/.test(s) || /^[\s]*-[^0-9]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function exportCSV() {
    var db = read();
    var rows = [[
      'Date UTC', 'Subject', 'Paper', 'Mode', 'Elapsed seconds', 'Score', 'Max score',
      'Question ID', 'Question position', 'Question text', 'Topic',
      'Selected option', 'Correct option', 'Outcome'
    ]];
    db.attempts.forEach(function (a) {
      (a.responses || []).forEach(function (r) {
        var q = db.questions[r.id] || {}, opts = q.options || [];
        rows.push([
          a.at, a.subject, a.paper, a.mode, a.elapsedSeconds, a.score, a.maxScore,
          r.id, r.position, q.text || '', q.topic || '',
          r.choice === null ? '' : (opts[r.choice] || ''),
          opts[q.answer] || '', r.outcome
        ]);
      });
    });
    download('championship-attempts-' + new Date().toISOString().slice(0, 10) + '.csv',
      'text/csv;charset=utf-8', '\uFEFF' + rows.map(function (r) {
        return r.map(csvCell).join(',');
      }).join('\r\n'));
  }
  function importJSON(file, done) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var incoming = JSON.parse(reader.result);
        if (!incoming || incoming.version !== 1 ||
            !Array.isArray(incoming.attempts) || !incoming.questions ||
            typeof incoming.questions !== 'object') throw Error('Not a valid progress export.');
        var db = read(), ids = {};
        db.attempts.forEach(function (a) { ids[a.id] = true; });
        var added = 0;
        incoming.attempts.forEach(function (a) {
          if (a && typeof a.id === 'string' && typeof a.at === 'string' &&
              Array.isArray(a.responses) && !ids[a.id]) {
            db.attempts.push(a); ids[a.id] = true; added++;
          }
        });
        Object.keys(incoming.questions).forEach(function (id) {
          var q = incoming.questions[id];
          if (q && typeof q.text === 'string' && Array.isArray(q.options) &&
              Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length) {
            db.questions[id] = q;
          }
        });
        db.attempts.sort(function (a, b) { return a.at.localeCompare(b.at); });
        if (db.attempts.length > MAX_ATTEMPTS) db.attempts = db.attempts.slice(-MAX_ATTEMPTS);
        if (!save(db)) throw Error('Browser storage is full or disabled.');
        done(null, added);
      } catch (e) { done(e, 0); }
    };
    reader.onerror = function () { done(Error('Could not read the file.'), 0); };
    reader.readAsText(file);
  }
  function node(tag, text, parent, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function dateText(at) {
    var d = new Date(at);
    return isNaN(d.getTime()) ? at : d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  function renderDashboard() {
    var stats = document.getElementById('progressStats');
    if (!stats) return;
    var db = read(), attempts = db.attempts.slice(), history = {}, answered = {};
    attempts.forEach(function (a) {
      (a.responses || []).forEach(function (r) {
        if (r.outcome === 'blank') return;
        answered[r.id] = true;
        if (!history[r.id]) history[r.id] = [];
        history[r.id].push({ outcome: r.outcome, date: a.at.slice(0, 10) });
      });
    });
    var reinforced = 0, stillMissed = [];
    Object.keys(history).forEach(function (id) {
      var h = history[id], last = h[h.length - 1], days = {};
      h.forEach(function (x) { if (x.outcome === 'correct') days[x.date] = true; });
      if (last.outcome === 'correct' && Object.keys(days).length >= 2) reinforced++;
      if (last.outcome === 'wrong') stillMissed.push(id);
    });
    stats.textContent = '';
    [
      ['Logged sessions', attempts.length],
      ['Unique questions attempted', Object.keys(answered).length],
      ['Reinforced across 2+ days', reinforced],
      ['Most recently missed', stillMissed.length]
    ].forEach(function (item) {
      var cell = node('div', null, stats, 'progress-stat');
      node('strong', item[1], cell);
      node('span', item[0], cell);
    });
    var recent = document.getElementById('recentAttempts');
    recent.textContent = '';
    if (!attempts.length) {
      node('p', 'No logged sessions yet. Finish a Study or Exam session to record it here.', recent);
    } else {
      var wrap = node('div', null, recent, 'progress-table-wrap');
      var table = node('table', null, wrap, 'progress-table');
      var head = node('thead', null, table);
      var headings = ['Date', 'Exam', 'Mode', 'Correct / wrong / blank', 'Score', 'Time'];
      var hr = node('tr', null, head);
      headings.forEach(function (h) { node('th', h, hr); });
      var body = node('tbody', null, table);
      attempts.slice(-12).reverse().forEach(function (a) {
        var tr = node('tr', null, body);
        [
          dateText(a.at), a.subject, a.mode,
          a.correct + ' / ' + a.wrong + ' / ' + a.blank,
          a.score + ' / ' + a.maxScore,
          Math.round(a.elapsedSeconds / 60) + ' min'
        ].forEach(function (v) { node('td', v, tr); });
        tr.title = a.paper;
      });
    }
    var misses = document.getElementById('missedQuestions');
    misses.textContent = '';
    stillMissed.slice(-12).reverse().forEach(function (id) {
      var q = db.questions[id]; if (!q) return;
      var detail = node('details', null, misses);
      node('summary', q.subject + ': ' + q.text, detail);
      node('p', 'Source: ' + q.paper + (q.topic ? ' | ' + q.topic : ''), detail);
      node('p', 'Correct answer: ' + ((q.options || [])[q.answer] || 'See source paper'), detail);
    });
    if (!stillMissed.length) node('p', 'No unresolved wrong answers logged yet.', misses);
  }
  function initDashboard() {
    if (!document.getElementById('progressStats')) return;
    document.getElementById('exportProgressJSON').addEventListener('click', exportJSON);
    document.getElementById('exportProgressCSV').addEventListener('click', exportCSV);
    document.getElementById('importProgress').addEventListener('change', function () {
      var input = this, msg = document.getElementById('progressNotice');
      if (!input.files || !input.files[0]) return;
      importJSON(input.files[0], function (err, count) {
        msg.textContent = err ? 'Import failed: ' + err.message :
          'Imported ' + count + ' new session(s). Existing sessions were retained.';
        input.value = '';
        if (!err) renderDashboard();
      });
    });
    renderDashboard();
  }
  window.ChampionshipProgress = {
    record: record, get: read, exportJSON: exportJSON, exportCSV: exportCSV,
    renderDashboard: renderDashboard
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDashboard);
  else initDashboard();
})();
