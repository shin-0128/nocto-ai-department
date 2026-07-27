'use strict';
/* =========================================================
   QuoteTool — 見積の実エンジン（事務のサキの中身）
   自己完結モジュール。外部依存は TANKA / TANKA_PRESETS（data/tanka.js）と
   MiniXLSX（data/minixlsx.js）のみ。デモapp.jsのグローバルとは衝突しない。
   使い方: QuoteTool.mount(rootEl)  /  QuoteTool.cleanup()
   ========================================================= */
const QuoteTool = (() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const yen = (n) => '¥' + Math.round(n).toLocaleString('ja-JP');
  let TIMERS = [];
  const after = (ms, fn) => { const id = setTimeout(fn, ms); TIMERS.push(id); return id; };
  const clearTimers = () => { TIMERS.forEach(clearTimeout); TIMERS = []; };
  const TAX = 0.10;
  let LEARNED = {};

  /* ---------- 単価リゾルバ（学習優先→標準） ---------- */
  function wallPrice(grade) {
    const std = TANKA.wall[grade] || TANKA.wall['シリコン'];
    if (LEARNED.wall) return { name: std.name, price: LEARNED.wall.price, source: '取込', unit: '㎡' };
    return { name: std.name, price: std.price, source: '標準', unit: '㎡' };
  }
  function roofPrice(grade) {
    const std = TANKA.roof[grade] || TANKA.roof['シリコン'];
    if (LEARNED.roof) return { name: std.name, price: LEARNED.roof.price, source: '取込', unit: '㎡' };
    return { name: std.name, price: std.price, source: '標準', unit: '㎡' };
  }
  function fixedPrice(key) {
    const f = TANKA.fixed[key];
    if (LEARNED[key]) return { name: f.name, price: LEARNED[key].price, source: '取込', unit: f.unit };
    return { name: f.name, price: f.price, source: '標準', unit: f.unit };
  }

  /* ---------- 積算エンジン ---------- */
  function buildLines(inp) {
    const lines = [];
    const wallArea = inp.wall ? inp.wallArea : 0;
    const roofArea = inp.roof ? inp.roofArea : 0;
    const anyPaint = wallArea > 0 || roofArea > 0;
    const scaffoldArea = inp.scaffoldArea > 0 ? inp.scaffoldArea : (wallArea > 0 ? wallArea : roofArea);
    if (anyPaint && scaffoldArea > 0) { const p = fixedPrice('scaffold'); lines.push({ ...p, qty: scaffoldArea, amount: p.price * scaffoldArea }); }
    if (anyPaint) {
      const washArea = wallArea + roofArea;
      const p = fixedPrice('wash'); lines.push({ ...p, qty: washArea, amount: p.price * washArea });
      if (inp.yojo !== false) { const y = fixedPrice('yojo'); lines.push({ ...y, qty: 1, amount: y.price }); }
    }
    if (inp.shitaji) { const s = fixedPrice('shitaji'); lines.push({ ...s, qty: 1, amount: s.price }); }
    if (wallArea > 0) { const w = wallPrice(inp.wallGrade); lines.push({ ...w, qty: wallArea, amount: w.price * wallArea }); }
    if (roofArea > 0) { const r = roofPrice(inp.roofGrade); lines.push({ ...r, qty: roofArea, amount: r.price * roofArea }); }
    if (inp.futai) { const f = fixedPrice('futai'); lines.push({ ...f, qty: 1, amount: f.price }); }
    if (inp.shokei !== false) { const s = fixedPrice('shokei'); lines.push({ ...s, qty: 1, amount: s.price }); }
    return lines;
  }
  function totals(lines, discount) {
    const subtotal = lines.reduce((a, x) => a + x.amount, 0);
    const disc = Math.min(discount || 0, subtotal);
    const taxable = subtotal - disc;
    const tax = Math.round(taxable * TAX);
    return { subtotal, disc, taxable, tax, total: taxable + tax };
  }

  function readInput() {
    const num = (id) => { const v = parseFloat($(id).value); return isNaN(v) ? 0 : v; };
    return {
      customer: $('#q-customer').value.trim(),
      wall: $('#q-wall').checked, wallArea: num('#q-wallArea'), wallGrade: $('#q-wallGrade').value,
      roof: $('#q-roof').checked, roofArea: num('#q-roofArea'), roofGrade: $('#q-roofGrade').value,
      scaffoldArea: num('#q-scaffoldArea'),
      shitaji: $('#q-shitaji').checked, futai: $('#q-futai').checked,
      yojo: true, shokei: true, discount: num('#q-discount'),
    };
  }
  function validInput(inp) {
    if (inp.wall && inp.wallArea <= 0) return '外壁の面積を入れてください';
    if (inp.roof && inp.roofArea <= 0) return '屋根の面積を入れてください';
    if (!inp.wall && !inp.roof) return '外壁か屋根、どちらかを選んでください';
    return null;
  }

  function qShow(id) { $$('.qscr').forEach((s) => s.classList.toggle('hidden', s.id !== id)); const el = $(id ? '#' + id : null); }

  function srcTag(source) {
    return source === '取込'
      ? '<span class="src src-learn">この会社の単価</span>'
      : '<span class="src src-std">標準単価</span>';
  }
  function runEstimate() {
    const inp = readInput();
    const err = validInput(inp);
    if (err) { alert(err); return; }
    const lines = buildLines(inp);
    const t = totals(lines, inp.discount);
    qShow('scr-run');
    const steps = $('#run-steps'); const live = $('#run-live');
    steps.innerHTML = ''; live.textContent = ''; clearTimers();
    const learnedUsed = lines.some((l) => l.source === '取込');
    let t0 = 0;
    const push = (html) => { const el = document.createElement('div'); el.className = 'logline'; el.innerHTML = html; if (!$('#run-steps')) return; $('#run-steps').appendChild(el); requestAnimationFrame(() => el.classList.add('in')); };
    after(t0 += 250, () => { if ($('#run-live')) $('#run-live').textContent = '① 工事を明細に分解…'; push(`工事内容を <b>${lines.length}項目</b> に分解した。`); });
    lines.forEach((l) => {
      after(t0 += 420, () => {
        if ($('#run-live')) $('#run-live').textContent = '② 単価を参照（出所も表示）…';
        const calc = (l.qty > 1 || l.unit === '㎡') ? `${l.qty.toLocaleString()}${l.unit} × ${yen(l.price)}` : `${l.unit}`;
        push(`「${l.name}」… 単価 <b>${yen(l.price)}</b> ${srcTag(l.source)} ／ ${calc} = <b>${yen(l.amount)}</b>`);
      });
    });
    after(t0 += 500, () => { if ($('#run-live')) $('#run-live').textContent = '③ 諸経費・値引き・消費税を計算…'; push(`小計 <b>${yen(t.subtotal)}</b>${t.disc ? ` ／ 値引 <b style="color:var(--warn)">-${yen(t.disc)}</b>` : ''} ／ 消費税10% <b>${yen(t.tax)}</b>`); });
    after(t0 += 500, () => { if ($('#run-live')) $('#run-live').textContent = learnedUsed ? '完成（この会社の実績単価で作成）。' : '完成（標準単価。過去見積を取り込めばこの会社の単価に）。'; push(`<b style="color:var(--cyan)">お見積金額 ${yen(t.total)}（税込）</b>`); after(700, () => renderQuote(inp, lines, t, learnedUsed)); });
  }

  function renderQuote(inp, lines, t, learnedUsed) {
    const rows = lines.map((l) => `
      <tr>
        <td>${l.name} ${l.source === '取込' ? '<span class="src src-learn mini">自社</span>' : ''}</td>
        <td class="num">${l.unit === '式' ? '一式' : l.qty.toLocaleString()}</td>
        <td class="num">${l.unit === '式' ? '' : yen(l.price)}</td>
        <td class="num">${yen(l.amount)}</td>
      </tr>`).join('');
    $('#quote-out').innerHTML = `
      <div class="quote-doc">
        <div class="quote-head"><div class="qh-title">御見積書</div><div class="qh-cust">${inp.customer ? inp.customer + ' 様' : 'お客様'}</div></div>
        <table class="quote-table">
          <thead><tr><th>項目</th><th class="num">数量</th><th class="num">単価</th><th class="num">金額</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="quote-sum">
          <div><span>小計</span><span>${yen(t.subtotal)}</span></div>
          ${t.disc ? `<div><span>出精値引き</span><span class="warn">-${yen(t.disc)}</span></div>` : ''}
          <div><span>消費税(10%)</span><span>${yen(t.tax)}</span></div>
          <div class="grand"><span>お見積金額</span><span>${yen(t.total)}</span></div>
        </div>
        <div class="quote-note">${learnedUsed ? '※単価はこの会社の単価（①②③選択・過去見積・入力）を使用（「自社」表示）。' : '※単価は標準値（仮）。①②③を選ぶ・過去見積を取り込むとこの会社の単価に置き換わります。'}<br>作成: Nocto AI事務員 ／ 金額は税込。有効期限 発行後30日。</div>
      </div>`;
    qShow('scr-quote');
  }

  /* ---------- 取込（MiniXLSX） ---------- */
  function classify(name) {
    const n = String(name);
    if (/足場|飛散/.test(n)) return 'scaffold';
    if (/洗浄/.test(n)) return 'wash';
    if (/養生/.test(n)) return 'yojo';
    if (/下地|補修|シール|コーキング|ひび|クラック/.test(n)) return 'shitaji';
    if (/付帯|軒天|雨樋|破風|鼻隠/.test(n)) return 'futai';
    if (/諸経費|運搬|廃材|一般管理/.test(n)) return 'shokei';
    if (/外壁/.test(n)) return 'wall';
    if (/屋根/.test(n)) return 'roof';
    return null;
  }
  function pickUnitPrice(nums) {
    const cand = nums.filter((x) => x >= 30 && x <= 3000000).sort((a, b) => a - b);
    if (!cand.length) return null;
    if (cand.length === 1) return cand[0];
    return cand[cand.length - 2];
  }
  const KEY_LABEL = { scaffold: '足場', wash: '高圧洗浄', yojo: '養生', shitaji: '下地補修', futai: '付帯部', shokei: '諸経費', wall: '外壁塗装', roof: '屋根塗装' };
  function setIngest(html) { $('#ingest-panel').innerHTML = html; $('#ingest-panel').classList.remove('hidden'); }
  async function ingestExcel(file) {
    setIngest('<div class="ing-sub">読み込み中…</div>');
    let result;
    try { result = await MiniXLSX.read(file); }
    catch (x) {
      const msg = x && x.message;
      if (msg === 'OLD_XLS') return setIngest(`<div class="ing-err">古い .xls 形式は未対応です。「.xlsx」または「.csv」で保存し直してください（${file.name}）。</div>`);
      if (msg === 'NO_DECOMPRESSION') return setIngest('<div class="ing-err">このブラウザはExcelの解凍に未対応です。最新のChrome/Safariでお試しください。</div>');
      return setIngest(`<div class="ing-err">読み込めませんでした（${file.name}）。xlsx か csv を選んでください。</div>`);
    }
    const found = [];
    result.sheets.forEach((sh) => {
      sh.rows.forEach((r) => {
        if (!Array.isArray(r)) return;
        const name = r.find((c) => typeof c === 'string' && c.trim().length >= 2);
        const nums = r.filter((c) => typeof c === 'number' && c > 0);
        if (!name) return;
        const key = classify(name); if (!key) return;
        const price = pickUnitPrice(nums); if (!price) return;
        found.push({ key, rawName: name.trim(), price });
      });
    });
    const byKey = {}; found.forEach((f) => { byKey[f.key] = f; });
    const items = Object.values(byKey);
    if (!items.length) { setIngest(`<div class="ing-err">単価らしき行を検出できませんでした（${file.name}）。下の単価表に直接入力するか、①②③から選んでください。</div>`); return; }
    clearPresetSel();
    items.forEach((it) => { const el = $(`#t-${it.key}`); if (el) el.value = it.price; });
    syncLearnedFromTable();
    setIngest(`<div class="ing-head ok">✓ ${file.name} から ${items.length}項目を反映（${items.map((it) => KEY_LABEL[it.key]).join('・')}）</div><div class="ing-sub">下の単価表に入りました。違っていればその場で編集できます。</div>`);
  }

  /* ---------- 単価表 / ①②③ ---------- */
  const ROWS = [
    { key: 'scaffold', label: '仮設足場', unit: '㎡' }, { key: 'wash', label: '高圧洗浄', unit: '㎡' },
    { key: 'wall', label: '外壁塗装', unit: '㎡' }, { key: 'roof', label: '屋根塗装', unit: '㎡' },
    { key: 'yojo', label: '養生', unit: '式' }, { key: 'shitaji', label: '下地補修', unit: '式' },
    { key: 'futai', label: '付帯部', unit: '式' }, { key: 'shokei', label: '諸経費', unit: '式' },
  ];
  function stdPrice(key) { if (key === 'wall') return TANKA.wall['シリコン'].price; if (key === 'roof') return TANKA.roof['シリコン'].price; return TANKA.fixed[key].price; }
  function renderTankaTable() {
    $('#tanka-table').innerHTML = ROWS.map((r) => `
      <div class="trow"><span class="tlabel">${r.label}</span>
        <span class="tinput"><input type="number" inputmode="numeric" id="t-${r.key}" placeholder="${stdPrice(r.key).toLocaleString()}"><span class="tunit">円/${r.unit}</span></span></div>`).join('');
    ROWS.forEach((r) => $(`#t-${r.key}`).addEventListener('input', () => { clearPresetSel(); syncLearnedFromTable(); }));
  }
  function syncLearnedFromTable() {
    ROWS.forEach((r) => { const v = parseFloat($(`#t-${r.key}`).value); if (!isNaN(v) && v > 0) LEARNED[r.key] = { price: v, source: 'この会社' }; else delete LEARNED[r.key]; });
    reflectLearned();
  }
  function renderPresets() {
    $('#presets').innerHTML = TANKA_PRESETS.map((p) => `
      <button type="button" class="preset-card" data-id="${p.id}">
        <span class="pl">${p.label}</span><span class="pd">${p.desc}</span>
        <span class="pk">外壁 ¥${p.tanka.wall.toLocaleString()}/㎡・屋根 ¥${p.tanka.roof.toLocaleString()}/㎡・足場 ¥${p.tanka.scaffold.toLocaleString()}/㎡</span>
      </button>`).join('');
    $$('#presets .preset-card').forEach((btn) => btn.addEventListener('click', () => {
      const p = TANKA_PRESETS.find((x) => x.id === +btn.dataset.id);
      ROWS.forEach((r) => { $(`#t-${r.key}`).value = p.tanka[r.key] != null ? p.tanka[r.key] : ''; });
      syncLearnedFromTable();
      $$('#presets .preset-card').forEach((b) => b.classList.toggle('sel', b === btn));
      setIngest(`<div class="ing-head ok">✓「${p.label.trim()}」の単価を入れました</div><div class="ing-sub">下の単価表で微調整もできます。空欄にすると標準単価に戻ります。</div>`);
    }));
  }
  function clearPresetSel() { $$('#presets .preset-card').forEach((b) => b.classList.remove('sel')); }
  function resetTanka() { ROWS.forEach((r) => { $(`#t-${r.key}`).value = ''; }); clearPresetSel(); syncLearnedFromTable(); $('#ingest-panel').classList.add('hidden'); }
  function reflectLearned() {
    const n = Object.keys(LEARNED).length; const badge = $('#learn-badge');
    if (!badge) return;
    if (n > 0) { badge.textContent = `この会社の単価 ${n}項目`; badge.classList.remove('hidden'); } else badge.classList.add('hidden');
  }
  function initGrades() {
    $('#q-wallGrade').innerHTML = Object.keys(TANKA.wall).map((g) => `<option value="${g}">${g}</option>`).join('');
    $('#q-roofGrade').innerHTML = Object.keys(TANKA.roof).map((g) => `<option value="${g}">${g}</option>`).join('');
  }

  const TEMPLATE = `
    <span class="chip hidden" id="learn-badge" style="display:none"></span>
    <section class="qscr" id="scr-input">
      <div class="hh"><div class="kicker">AI事務員・見積</div>
        <h1>工事の条件を入れるだけ。<br><span class="em">数十秒で、見積。</span></h1>
        <p class="lead">面倒な積算はAIがやります。社長は<b>確認して、承認するだけ</b>。<br>過去の見積を取り込めば、<b>この会社の単価</b>そのままで出せます。</p>
      </div>
      <div class="stage">
        <div class="fieldlabel"><span class="q">1</span>お客様名</div>
        <input class="fld" id="q-customer" type="text" placeholder="例）田中 / 田中様邸" autocomplete="off">
        <div class="fieldlabel" style="margin-top:18px;"><span class="q">2</span>この会社の単価</div>
        <div class="hint">①②③から近いものを選ぶ／過去見積を取り込む／下の表に直接入力、どれでもOK。空欄は標準単価を使います。</div>
        <div class="presets" id="presets"></div>
        <label class="btn btn-ghost btn-block filebtn" style="margin-top:10px;">📄 過去見積（Excel/CSV）を取り込む<input type="file" id="q-file" accept=".xlsx,.csv" hidden></label>
        <div class="ingest hidden" id="ingest-panel"></div>
        <div class="tanka-table" id="tanka-table"></div>
        <button type="button" class="linkbtn" id="btn-reset-tanka">標準単価に戻す</button>
        <div class="fieldlabel" style="margin-top:18px;"><span class="q">3</span>工事内容</div>
        <div class="checks">
          <label class="chk"><input type="checkbox" id="q-wall" checked> 外壁塗装</label>
          <label class="chk"><input type="checkbox" id="q-roof"> 屋根塗装</label>
        </div>
        <div id="wall-fields" class="subfields"><div class="row2">
          <div><div class="minilabel">外壁 塗装面積</div><div class="unitfield"><input class="fld" id="q-wallArea" type="number" inputmode="decimal" placeholder="120"><span>㎡</span></div></div>
          <div><div class="minilabel">グレード</div><select class="fld" id="q-wallGrade"></select></div>
        </div></div>
        <div id="roof-fields" class="subfields hidden"><div class="row2">
          <div><div class="minilabel">屋根 塗装面積</div><div class="unitfield"><input class="fld" id="q-roofArea" type="number" inputmode="decimal" placeholder="80"><span>㎡</span></div></div>
          <div><div class="minilabel">グレード</div><select class="fld" id="q-roofGrade"></select></div>
        </div></div>
        <div class="fieldlabel" style="margin-top:18px;"><span class="q">4</span>オプション</div>
        <div class="checks">
          <label class="chk"><input type="checkbox" id="q-shitaji" checked> 下地補修</label>
          <label class="chk"><input type="checkbox" id="q-futai" checked> 付帯部塗装</label>
        </div>
        <div class="row2" style="margin-top:12px;">
          <div><div class="minilabel">足場面積（任意・空欄で自動）</div><div class="unitfield"><input class="fld" id="q-scaffoldArea" type="number" inputmode="decimal" placeholder="自動"><span>㎡</span></div></div>
          <div><div class="minilabel">出精値引き（任意）</div><div class="unitfield"><input class="fld" id="q-discount" type="number" inputmode="numeric" placeholder="0"><span>円</span></div></div>
        </div>
        <button class="btn btn-primary btn-block mt20" id="btn-make">AIに見積を作らせる</button>
      </div>
      <div class="disclaimer">単価は標準値（仮）。①②③選択・過去見積取込でこの会社の単価に置き換わります。写真は端末内でのみ処理・送信しません。 Nocto, Inc.</div>
    </section>
    <section class="qscr hidden" id="scr-run">
      <div class="stage"><h2>② AIが積算中 <span class="sub2">— 中身は全部見せます</span></h2>
        <p class="sub">単価をどこから引いたか（標準／この会社）まで丸見えです。</p>
        <div class="brain"><div class="bh"><span class="dotlive"></span>AIの積算ログ（リアルタイム）</div><div class="logsteps" id="run-steps"></div><div class="livemsg" id="run-live"></div></div>
      </div>
    </section>
    <section class="qscr hidden" id="scr-quote">
      <div class="stage"><h2>③ 見積書ができました</h2><p class="sub">確認して、そのまま出せます。</p>
        <div id="quote-out"></div>
        <button class="btn btn-primary btn-block mt16" id="btn-again">条件を変えてやり直す</button>
        <p class="footnote">これが毎回、数十秒。事務員を一人雇うより安く、採用も引き継ぎもゼロ。</p>
      </div>
    </section>`;

  function mount(root) {
    clearTimers(); LEARNED = {};
    root.innerHTML = TEMPLATE;
    initGrades(); renderPresets(); renderTankaTable();
    $('#btn-make').addEventListener('click', runEstimate);
    $('#btn-again').addEventListener('click', () => { clearTimers(); qShow('scr-input'); });
    $('#btn-reset-tanka').addEventListener('click', resetTanka);
    $('#q-file').addEventListener('change', (ev) => { const f = ev.target.files && ev.target.files[0]; if (f) ingestExcel(f).catch(() => setIngest('<div class="ing-err">読み込みでエラーが発生しました。</div>')); ev.target.value = ''; });
    const sync = () => { $('#wall-fields').classList.toggle('hidden', !$('#q-wall').checked); $('#roof-fields').classList.toggle('hidden', !$('#q-roof').checked); };
    $('#q-wall').addEventListener('change', sync);
    $('#q-roof').addEventListener('change', sync);
    sync();
  }
  function cleanup() { clearTimers(); }

  return { mount, cleanup };
})();
