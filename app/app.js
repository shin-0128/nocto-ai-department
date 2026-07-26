'use strict';
/* =========================================================
   Nocto AI Department — App (SPA / hash router)
   外装リフォーム会社向け。困りごと = バックオフィス / 採用・雇用 / 発信・説明動画。
   営業・集客は「困っていない」ので前面に出さない。
   効果数値はすべて仮試算。実測は導入初月に取る前提(断定しない)。
   ========================================================= */

/* ---------- utils ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const h  = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const yen = (n) => '¥' + n.toLocaleString('ja-JP');
let TIMERS = [];
const after = (ms, fn) => { const id = setTimeout(fn, ms); TIMERS.push(id); return id; };
const clearTimers = () => { TIMERS.forEach(clearTimeout); TIMERS = []; };

/* ---------- 共通: 作業ログ(実況)UI ---------- */
// steps = [{ic,lbl,key}] を受け取り brain ブロックのHTMLを返す
function stepsUI(steps) {
  return `<div class="brain">
    <div class="bh"><span class="dotlive"></span>AIの作業ログ（リアルタイム）</div>
    <div class="steps">${steps.map((s) => `<div class="stp" data-key="${s.key}"><div class="ic">${s.ic}</div><div class="lbl">${s.lbl}</div><div class="bar"><i></i></div></div>`).join('')}</div>
    <div class="livemsg"></div>
  </div>`;
}
// seq = [[key, message, durationMs], ...] を scopeEl 内の steps に対して順に実況し、最後に done()
function runSteps(scopeEl, seq, done) {
  const setStep = (k, st) => $$('.stp', scopeEl).forEach((el) => { if (el.dataset.key === k) { el.classList.remove('active', 'done'); el.classList.add(st); } });
  const bar = (k, p) => { const el = $(`.stp[data-key="${k}"] .bar > i`, scopeEl); if (el) el.style.width = p + '%'; };
  const say = (m) => { const el = $('.livemsg', scopeEl); if (el) el.textContent = m; };
  let t = 0;
  seq.forEach(([key, msg, dur]) => {
    after(t, () => { setStep(key, 'active'); say(msg); });
    for (let s = 1; s <= 8; s++) after(t + dur * s / 8, () => bar(key, Math.round(s / 8 * 100)));
    after(t + dur, () => setStep(key, 'done'));
    t += dur;
  });
  after(t + 300, () => { say('完成。'); if (done) done(); });
}
// デモ末尾の共通CTA(他の社員へ / やり直し)
function demoCta(title, sub, replayLabel) {
  return `<div class="cta mt20" style="margin-left:0;margin-right:0;">
    <h2>${title}</h2>
    <p>${sub}</p>
    <button class="btn btn-primary btn-block" data-cta-home>他の社員を見る</button>
    <button class="btn btn-ghost btn-block mt12" data-cta-replay>${replayLabel || 'もう一度やる'}</button>
  </div>`;
}
function wireDemoCta(root, replayFn) {
  const hs = $('[data-cta-home]', root); if (hs) hs.addEventListener('click', () => { location.hash = '#/'; });
  const rp = $('[data-cta-replay]', root); if (rp) rp.addEventListener('click', replayFn);
}

/* ---------- AI社員 roster ---------- */
const SECTIONS = [
  {
    n: '01', title: 'バックオフィス', tag: '一番の困りごと',
    ids: ['keiri', 'seikyu', 'genba']
  },
  {
    n: '02', title: '採用・雇用', tag: null,
    ids: ['saiyo', 'ikusei']
  },
  {
    n: '03', title: '発信・会社の説明動画', tag: null,
    ids: ['koho', 'kuchikomi']
  },
  {
    n: '04', title: 'ついでに効くやつ', tag: null,
    ids: ['hojokin', 'denwa']
  }
];

const EMP = {
  keiri: {
    emoji: '🧾', name: '経理のジロー', role: 'AI社員・経理担当',
    one: '領収書とレシートを放り込むだけ。金額も勘定科目も自動で仕分け → freee/弥生にそのまま。',
    kind: 'demo', render: renderKeiri
  },
  seikyu: {
    emoji: '📄', name: '事務のサキ', role: 'AI社員・見積/請求担当',
    one: '「〇〇様 外壁塗装 一式」で見積書も請求書も一発。インボイス番号・振込先も自動。',
    kind: 'demo', render: renderSeikyu
  },
  genba: {
    emoji: '📸', name: '現場のケン', role: 'AI社員・写真整理担当',
    one: '現場写真をぐちゃっと渡すだけ。工程別に整理し、お客様向けBefore/After報告書に。',
    kind: 'demo', render: renderGenba
  },
  saiyo: {
    emoji: '🧑‍💼', name: '採用のハナ', role: 'AI社員・採用担当',
    one: '職種と推しを選ぶだけで求人原稿を3媒体ぶん生成。応募が来たら一次返信と面接候補日も下書き。',
    kind: 'demo', render: renderSaiyo
  },
  ikusei: {
    emoji: '🎓', name: '育成のトモ', role: 'AI社員・教育担当',
    one: '新人が現場で見る手順動画・チェックリストを自動で。「見て覚えろ」を仕組みに変える。',
    kind: 'demo', render: renderIkusei
  },
  koho: {
    emoji: '🎬', name: '広報のトオル', role: 'AI社員・動画/発信担当',
    one: '会社の説明動画、台本も絵コンテも自動。撮るだけの状態に落とし込む。外注費を圧縮。',
    kind: 'demo', render: renderKoho
  },
  kuchikomi: {
    emoji: '⭐', name: '評判のミオ', role: 'AI社員・口コミ対応担当',
    one: 'Googleの口コミに、その会社らしい丁寧な返信を下書き。星が付く運用を続ける。',
    kind: 'demo', render: renderKuchikomi
  },
  hojokin: {
    emoji: '🏛️', name: '見張り番のゲン', role: 'AI社員・補助金担当',
    one: '外壁・断熱・省エネ改修の補助金を常時ウォッチ。使える案件を逃さず、お客様への提案材料にも。',
    kind: 'demo', render: renderHojokin
  },
  denwa: {
    emoji: '📞', name: '電話番のリン', role: 'AI社員・一次対応担当',
    one: '取り込み中でも電話を取りこぼさない。用件を聞いて、折返し予約とメモを残す。',
    kind: 'demo', render: renderDenwa
  }
};

/* =========================================================
   HOME
   ========================================================= */
function renderHome(root) {
  setBar({ back: false, title: null });
  root.innerHTML = `
    <div class="hh">
      <div class="kicker">NOCTO AI DEPARTMENT</div>
      <h1>採らない。育てない。辞めない。<br><span class="em">それでも、人が増える。</span></h1>
      <p class="lead">御社の裏方仕事を、<b>設定済みのAI社員</b>としてまとめて配属します。<br>ITは苦手なままでいい。社長の仕事は「<b>確認して、承認するだけ</b>」。</p>
      <div class="forwho"><span class="t">想定</span><span>外装リフォーム／困りごと＝事務・採用・会社の発信。営業は既に強い前提。</span></div>
    </div>
    <div id="sections"></div>
    <div class="section">
      <div class="cta" style="margin-top:8px;">
        <h2>気になった社員を、まず"働かせて"みてください</h2>
        <p>上のカードはタップすると実際に動きます。<br>「これなら任せられる」が入口です。</p>
        <div class="roles">
          <span>事務・経理</span><span>採用</span><span>説明動画</span><span>補助金</span><span>電話番</span>
        </div>
      </div>
    </div>
    <div class="disclaimer">これは実演デモです。生成結果・仕分けはデモ用のサンプルで、実サービスでは実データをAIが処理します。<br>効果数値はすべて仮試算です（実測は導入初月に取ります）。 Nocto, Inc.</div>
  `;
  const wrap = $('#sections', root);
  SECTIONS.forEach((sec) => {
    const s = h(`<div class="section">
      <div class="sh"><span class="n">${sec.n}</span><h2>${sec.title}</h2>${sec.tag ? `<span class="tag">${sec.tag}</span>` : ''}</div>
      <div class="roster"></div>
    </div>`);
    const rost = $('.roster', s);
    sec.ids.forEach((id) => {
      const e = EMP[id];
      const badge = e.kind === 'demo'
        ? '<span class="badge demo">実演できる</span>'
        : '<span class="badge soon">仕組みを見る</span>';
      const card = h(`<button class="emp ${e.kind === 'demo' ? 'live' : ''}" data-id="${id}">
        <div class="ava"><span class="em2">${e.emoji}</span></div>
        <div class="body">
          <div class="nm">${e.name} ${badge}</div>
          <div class="role">${e.role}</div>
          <div class="one">${e.one}</div>
        </div>
        <div class="go">›</div>
      </button>`);
      card.addEventListener('click', () => { location.hash = '#/emp/' + id; });
      rost.appendChild(card);
    });
    wrap.appendChild(s);
  });
  window.scrollTo(0, 0);
}

/* shared worker header */
function workerHead(e) {
  return `<div class="workerhead">
    <div class="ava">${e.emoji}</div>
    <div>
      <div class="nm">${e.name}</div>
      <div class="rl">${e.role}・24時間勤務／辞めない</div>
      <div class="dt">${e.one}</div>
    </div>
  </div>`;
}

/* generic concept view (非実演カード) */
function renderConcept(root, id) {
  const e = EMP[id];
  const c = e.concept;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage">
      <h2>こう効きます</h2>
      <p class="sub">${e.name}が入ると、日々のこの手間が「確認だけ」に変わります。</p>
      <div class="gen"><div class="gt">😵 いま（人がやっている）</div><p style="color:var(--text);">${c.before}</p></div>
      <div class="gen" style="border-color:var(--cyan-dim);"><div class="gt">✅ AI社員が入ると</div><p style="color:var(--text);">${c.after}</p></div>
      <div class="gen">
        <div class="gt">🔧 具体的には</div>
        ${c.sample.map((s) => `<p>${s}</p>`).join('')}
      </div>
      <p class="footnote">${c.note}</p>
    </div>
    <div class="cta">
      <h2>この社員も"セット"に含められます</h2>
      <p>まずは実演できる社員（経理・採用・説明動画）で手応えを見て、御社に要る順で足していきましょう。</p>
      <button class="btn btn-primary btn-block" data-home>他の社員を見る</button>
    </div>
  `;
  $('[data-home]', root).addEventListener('click', () => { location.hash = '#/'; });
  window.scrollTo(0, 0);
}

/* =========================================================
   実演① 経理のジロー — 領収書の自動仕分け
   ========================================================= */
const KEIRI_DOCS = [
  { n: 'ホームセンター', memo: '塗料・刷毛・養生テープ', amt: 12800, kind: '材料仕入', conf: 97 },
  { n: '出光SS 給油', memo: '軽トラ 給油', amt: 8200, kind: '車両費', conf: 96 },
  { n: '足場リース ◯◯', memo: '外壁足場 7日', amt: 45000, kind: '外注費', conf: 95 },
  { n: 'ETC 高速道路', memo: '現場往復', amt: 3400, kind: '旅費交通費', conf: 94 },
  { n: '携帯 キャリア', memo: '社用スマホ', amt: 9800, kind: '通信費', conf: 96 },
  { n: '事務用品店', memo: 'コピー用紙・ペン', amt: 2300, kind: '消耗品費', conf: 93 },
  { n: 'コメリ', memo: '高圧洗浄機', amt: 38000, kind: '工具器具備品', conf: 66, need: true, guess: '工具器具備品', alt: ['工具器具備品', '消耗品費', '材料仕入'] },
  { n: '飲食店 ◯◯', memo: '職人と昼食', amt: 6500, kind: '福利厚生費', conf: 61, need: true, guess: '福利厚生費', alt: ['福利厚生費', '接待交際費', '会議費'] },
];
const KEIRI_STEPS = [
  { ic: '1', lbl: '写真・PDFを読み込み', key: 'load' },
  { ic: '2', lbl: '何の支払いか判定', key: 'what' },
  { ic: '3', lbl: '金額・日付・店名を読取(OCR)', key: 'ocr' },
  { ic: '4', lbl: '勘定科目へ自動振り分け', key: 'sort' },
];

function renderKeiri(root) {
  const e = EMP.keiri;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="k0">
      <h2>① 月末の領収書を、まとめて放り込む</h2>
      <p class="sub">財布やダッシュボードに溜めたレシート・請求書を、仕分けせず<b style="color:#fff;">そのまま</b>渡すだけ。<br>(このデモではサンプル8枚を使います)</p>
      <div class="brain"><div class="steps" id="kPile"></div></div>
      <button class="btn btn-primary btn-block mt16" id="kStart">領収書を投入する（サンプル8枚）</button>
    </div>
    <div class="stage hidden" id="k1">
      <h2>② ジローが仕分け中 <span style="font-size:12px;color:var(--text-dim);font-family:-apple-system,sans-serif;">— 丸見えです</span></h2>
      <p class="sub">人が触るところはゼロ。今やっていることを下に実況します。</p>
      <div class="brain">
        <div class="bh"><span class="dotlive"></span>AIの作業ログ（リアルタイム）</div>
        <div class="steps" id="kSteps"></div>
        <div class="livemsg" id="kLive"></div>
      </div>
    </div>
    <div class="stage hidden" id="k2">
      <h2>③ 勘定科目ごとに、仕訳が完成</h2>
      <p class="sub">店名・金額・日付を読み取り、科目を判定しました。あなたは<b style="color:#fff;">確認して承認するだけ</b>です。</p>
      <div class="gen"><div class="gt">📒 仕訳台帳（自動作成）<span class="pill">freee/弥生に取込可</span></div><div id="kLedger"></div></div>
      <div class="review" id="kReview">
        <h3>要確認 — 2件だけ、判断をください</h3>
        <p class="rsub">ジローが「自信がない」と正直に申告した支払いです。正しい科目をタップしてください。</p>
        <div id="kReviewList"></div>
      </div>
      <button class="btn btn-primary btn-block mt16" id="kApprove">この仕訳を承認する</button>
    </div>
    <div class="stage hidden" id="k3">
      <h2>④ 承認完了 — そのまま会計ソフトへ</h2>
      <p class="sub">これが毎月、勝手に片付きます。夜に領収書を広げる時間は要りません。</p>
      <div class="impact">
        <div class="cell human"><div class="lab">手入力なら<br>(月120枚)</div><div class="val">約6<small>時間</small></div></div>
        <div class="cell"><div class="lab">ジローの<br>処理</div><div class="val">約90<small>秒</small></div></div>
        <div class="cell you"><div class="lab">あなたの<br>確認</div><div class="val">約5<small>分</small></div></div>
      </div>
      <p class="footnote">科目の判定と要確認の切り分けまでAIがやり、迷った所だけ人に聞く。※数値は仮試算。</p>
      <div class="cta mt16" style="margin-left:0;margin-right:0;">
        <h2>見積・請求も、同じやり方で回ります</h2>
        <p>経理が回り出したら、次は請求と採用へ。要る順に社員を足せます。</p>
        <button class="btn btn-primary btn-block" id="kHome">他の社員を見る</button>
        <button class="btn btn-ghost btn-block mt12" id="kReplay">もう一度、実演を見る</button>
      </div>
    </div>
  `;

  const pileHtml = KEIRI_DOCS.map((d) => `<div class="docrow"><div class="dic">🧾</div><div class="dbody"><div class="dn">${d.n}</div><div class="dm">${d.memo}</div></div></div>`).join('');
  $('#kPile').innerHTML = pileHtml;

  $('#kSteps').innerHTML = KEIRI_STEPS.map((s) => `<div class="stp" data-key="${s.key}"><div class="ic">${s.ic}</div><div class="lbl">${s.lbl}</div><div class="bar"><i></i></div></div>`).join('');

  const setStep = (key, st) => $$('#kSteps .stp').forEach((el) => { if (el.dataset.key === key) { el.classList.remove('active', 'done'); el.classList.add(st); } });
  const bar = (key, pct) => { const el = $(`#kSteps .stp[data-key="${key}"] .bar > i`); if (el) el.style.width = pct + '%'; };
  const say = (m) => { $('#kLive').textContent = m; };

  $('#kStart').addEventListener('click', () => { show('k0', 'k1'); after(250, runK); });

  function runK() {
    const N = KEIRI_DOCS.length, per = 300;
    setStep('load', 'active');
    KEIRI_DOCS.forEach((d, i) => after(per * i * 0.25, () => bar('load', Math.round((i + 1) / N * 100))));
    after(per * N * 0.25 + 150, () => {
      setStep('load', 'done'); bar('load', 100); setStep('what', 'active');
      KEIRI_DOCS.forEach((d, i) => after(per * i, () => { say(`「${d.n}」… ${d.memo} だな`); bar('what', Math.round((i + 1) / N * 100)); }));
      after(per * N + 120, () => {
        setStep('what', 'done'); setStep('ocr', 'active');
        KEIRI_DOCS.forEach((d, i) => after(110 * i, () => { say(`金額を読取: ${yen(d.amt)}`); bar('ocr', Math.round((i + 1) / N * 100)); }));
        after(110 * N + 120, () => {
          setStep('ocr', 'done'); setStep('sort', 'active');
          KEIRI_DOCS.forEach((d, i) => after(120 * i, () => { say(d.need ? `「${d.n}」… 科目に迷い(${d.conf}%)。あとで確認に回す` : `「${d.n}」→ ${d.kind} へ`); bar('sort', Math.round((i + 1) / N * 100)); }));
          after(120 * N + 250, () => { setStep('sort', 'done'); say('仕分け完了。自信のない2件だけ確認をお願いします。'); after(500, showKResult); });
        });
      });
    });
  }

  function showKResult() {
    const led = $('#kLedger');
    led.innerHTML = KEIRI_DOCS.map((d) => {
      const cls = d.need ? 'lo' : 'hi';
      const kindLabel = d.need ? `${d.guess}?` : d.kind;
      return `<div class="docrow" data-n="${d.n}"><div class="dic">🧾</div><div class="dbody"><div class="dn">${d.n}</div><div class="dm">${d.memo}</div></div><div style="text-align:right;"><div class="damt">${yen(d.amt)}</div><span class="dkind ${cls}" data-kindlabel="${d.n}">${kindLabel} ${d.conf}%</span></div></div>`;
    }).join('');

    const needs = KEIRI_DOCS.filter((d) => d.need);
    $('#kReviewList').innerHTML = needs.map((d) => `
      <div class="review-item" data-n="${d.n}">
        <div class="rq">「${d.n}」${yen(d.amt)}（${d.memo}）<br>ジローの予想: <b>${d.guess}</b>…でも自信は${d.conf}%。どれ？</div>
        <div class="opts">${d.alt.map((a) => `<button class="opt" data-n="${d.n}" data-kind="${a}">${a}</button>`).join('')}</div>
      </div>`).join('');

    show('k1', 'k2');
    bindKReview(needs.length);
  }

  let kResolved = {};
  function bindKReview(total) {
    kResolved = {};
    $$('#kReviewList .opt').forEach((btn) => btn.addEventListener('click', () => {
      const n = btn.dataset.n, kind = btn.dataset.kind;
      const item = $(`.review-item[data-n="${n}"]`);
      $$('.opt', item).forEach((b) => b.classList.toggle('sel', b === btn));
      kResolved[n] = kind;
      const lbl = $(`[data-kindlabel="${n}"]`);
      if (lbl) { lbl.textContent = kind; lbl.classList.remove('lo'); lbl.classList.add('hi'); }
      item.classList.add('resolved');
      updateKApprove(total);
    }));
    updateKApprove(total);
  }
  function updateKApprove(total) {
    const left = total - Object.keys(kResolved).length;
    const btn = $('#kApprove');
    if (left > 0) { btn.textContent = `あと${left}件、科目をタップ`; btn.disabled = true; }
    else { btn.textContent = 'この仕訳を承認する'; btn.disabled = false; }
  }

  $('#kApprove').addEventListener('click', () => {
    show('k2', 'k3');
    $('#k3').classList.remove('hidden');
  });
  $('#kHome').addEventListener('click', () => { location.hash = '#/'; });
  $('#kReplay').addEventListener('click', () => renderKeiri(root));
  window.scrollTo(0, 0);
}

/* =========================================================
   実演② 採用のハナ — 求人原稿＋応募一次対応
   ========================================================= */
const SAIYO_ROLES = [
  { id: 'toso', label: '塗装職人', oc: '🎨' },
  { id: 'kanri', label: '現場管理', oc: '📐' },
  { id: 'jimu', label: '事務', oc: '💻' },
];
const SAIYO_PUSH = [
  { id: 'mikeiken', label: '未経験歓迎' },
  { id: 'kyujitsu', label: '週休2日' },
  { id: 'shikaku', label: '資格支援あり' },
  { id: 'kazoku', label: 'アットホーム' },
  { id: 'kyuyo', label: '高日給' },
  { id: 'chokkin', label: '直行直帰OK' },
];
const SAIYO_STEPS = [
  { ic: '1', lbl: '欲しい人物像を設定', key: 'persona' },
  { ic: '2', lbl: '刺さる見出しを作成', key: 'title' },
  { ic: '3', lbl: '本文を執筆', key: 'body' },
  { ic: '4', lbl: '媒体別に最適化', key: 'media' },
  { ic: '5', lbl: '誇大・NGワードを除去', key: 'ng' },
];

function renderSaiyo(root) {
  const e = EMP.saiyo;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="s0">
      <h2>① どんな人を、どう募る？</h2>
      <p class="sub">2つ選ぶだけ。あとはハナが求人原稿を書きます。</p>
      <div class="fieldlabel"><span class="q">1</span>募集する職種</div>
      <div class="opts" id="sRole"></div>
      <div class="fieldlabel"><span class="q">2</span>推しポイント（複数OK）</div>
      <div class="opts" id="sPush"></div>
      <button class="btn btn-primary btn-block mt20" id="sStart" disabled>この条件で求人を書かせる</button>
    </div>
    <div class="stage hidden" id="s1">
      <h2>② ハナが執筆中 <span style="font-size:12px;color:var(--text-dim);font-family:-apple-system,sans-serif;">— 考えてる中身も見せます</span></h2>
      <div class="brain">
        <div class="bh"><span class="dotlive"></span>AIの作業ログ（リアルタイム）</div>
        <div class="steps" id="sSteps"></div>
        <div class="livemsg" id="sLive"></div>
      </div>
    </div>
    <div class="stage hidden" id="s2">
      <h2>③ 求人原稿ができました</h2>
      <p class="sub">そのまま貼れる状態です。媒体ごとに文体も変えてあります。</p>
      <div id="sOut"></div>
      <div class="divider"></div>
      <h2 style="font-size:16px;">おまけ：応募が来たら？</h2>
      <p class="sub">返信が遅いと他社に取られます。ハナが一次返信と面接候補日まで下書きします。</p>
      <button class="btn btn-ghost btn-block" id="sApply">「応募が来た」ことにする</button>
      <div id="sReply" class="hidden"></div>
      <div class="cta mt20" style="margin-left:0;margin-right:0;">
        <h2>採用の"書く・返す"が消えます</h2>
        <p>求人1本 半日 → 3分。応募の返信遅れゼロ。※仮試算。</p>
        <button class="btn btn-primary btn-block" id="sHome">他の社員を見る</button>
        <button class="btn btn-ghost btn-block mt12" id="sReplay">条件を変えてやり直す</button>
      </div>
    </div>
  `;

  let role = null; const push = new Set();
  const roleWrap = $('#sRole'), pushWrap = $('#sPush');
  SAIYO_ROLES.forEach((r) => {
    const b = h(`<button class="opt" data-id="${r.id}"><span class="oc">${r.oc}</span>${r.label}</button>`);
    b.addEventListener('click', () => { role = r; $$('.opt', roleWrap).forEach((x) => x.classList.toggle('sel', x === b)); upd(); });
    roleWrap.appendChild(b);
  });
  SAIYO_PUSH.forEach((p) => {
    const b = h(`<button class="opt" data-id="${p.id}">${p.label}</button>`);
    b.addEventListener('click', () => { b.classList.toggle('sel'); push.has(p.id) ? push.delete(p.id) : push.add(p.id); upd(); });
    pushWrap.appendChild(b);
  });
  const upd = () => { $('#sStart').disabled = !(role && push.size); };

  $('#sSteps').innerHTML = SAIYO_STEPS.map((s) => `<div class="stp" data-key="${s.key}"><div class="ic">${s.ic}</div><div class="lbl">${s.lbl}</div><div class="bar"><i></i></div></div>`).join('');
  const setStep = (key, st) => $$('#sSteps .stp').forEach((el) => { if (el.dataset.key === key) { el.classList.remove('active', 'done'); el.classList.add(st); } });
  const bar = (key, pct) => { const el = $(`#sSteps .stp[data-key="${key}"] .bar > i`); if (el) el.style.width = pct + '%'; };
  const say = (m) => { $('#sLive').textContent = m; };

  $('#sStart').addEventListener('click', () => { show('s0', 's1'); after(250, () => runS(role, push)); });

  function runS(role, pushSet) {
    const pushLabels = SAIYO_PUSH.filter((p) => pushSet.has(p.id)).map((p) => p.label);
    const seq = [
      ['persona', `${role.label}志望の${pushSet.has('mikeiken') ? '未経験' : '経験'}層をターゲットに設定`, 500],
      ['title', '「稼げる×続けられる」で見出しを3案…', 700],
      ['body', '仕事内容・1日の流れ・待遇を具体で執筆中…', 900],
      ['media', 'Indeed／ハローワーク／Instagram に文体を最適化…', 800],
      ['ng', '「絶対」「日本一」等の誇大表現を除去、賃金表記を法に整える…', 600],
    ];
    let t = 0;
    seq.forEach(([key, msg, dur], i) => {
      after(t, () => { setStep(key, 'active'); say(msg); });
      const steps = 8;
      for (let s = 1; s <= steps; s++) after(t + dur * s / steps, () => bar(key, Math.round(s / steps * 100)));
      after(t + dur, () => setStep(key, 'done'));
      t += dur;
    });
    after(t + 300, () => { say('完成。そのまま出せます。'); showSResult(role, pushLabels); });
  }

  function showSResult(role, pushLabels) {
    const titleMap = {
      toso: '未経験から“手に職”。外壁塗装の職人、募集します',
      kanri: '現場を仕切る人、探しています｜外装リフォームの施工管理',
      jimu: '“社長の右腕”になる事務、募集｜外装リフォーム会社',
    };
    const bodyMap = {
      toso: `外壁・屋根の塗装職人を募集します。\n「見て覚えろ」ではなく、手順は動画とベテランが教えます。\n\n▍仕事内容\n戸建て・アパートの外壁/屋根塗装。高圧洗浄→下地→下塗り→中塗り→上塗りまで。\n▍1日の流れ\n8:00 直行 / 現場作業 / 17:00 直帰。残業ほぼなし。\n▍こんな人歓迎\n体を動かす仕事が好き / モノづくりが好き / 手に職をつけたい。`,
      kanri: `外装リフォームの現場管理（施工管理）を募集します。\n複数現場の段取り・職人手配・お客様対応・写真管理まで。\n\n▍仕事内容\n見積〜引き渡しの進行管理。写真整理や報告書はAIがサポートします。\n▍歓迎\n建築/塗装の経験者、普通免許。未経験でも現場好きなら相談可。`,
      jimu: `外装リフォーム会社の事務を募集します。\n見積・請求・電話対応など。定型作業はAI社員が下ごしらえ、あなたは確認と気配りに集中。\n\n▍仕事内容\n書類作成／来客・電話対応／かんたんな経理補助。\n▍歓迎\n基本のPC操作ができる方。ブランクありも歓迎。`,
    };
    const push = pushLabels.length ? pushLabels.join('・') : '働きやすさ重視';
    const media = [
      { m: 'Indeed 向け（検索で見つかる書き方）', body: `【${push}】${titleMap[role.id]}\n\n${bodyMap[role.id]}\n\n#外装リフォーム #${role.label} #${pushLabels[0] || '未経験歓迎'}` },
      { m: 'ハローワーク 向け（かっちり）', body: `職種：${role.label}（外装リフォーム）\n雇用形態：正社員\n仕事の内容：${bodyMap[role.id].split('\n').slice(0, 3).join(' ')}\n待遇：${push}。詳細は面接にて。` },
      { m: 'Instagram 向け（人柄で惹く）', body: `＼仲間を探しています／\n${titleMap[role.id]}\n\n${push}な職場です。\nまずはDMで「話だけ聞きたい」でもOK◎\nプロフィールのリンクから応募できます。` },
    ];
    $('#sOut').innerHTML = `
      <div class="gen"><div class="gt">📝 見出し案<span class="pill">3案</span></div>
        <h4>${titleMap[role.id]}</h4>
        <p style="margin-top:8px;">・${push}を前面に／・「未経験でも手順は教える」で不安を消す／・1日の流れを具体化</p>
      </div>
      ${media.map((x) => `<div class="gen"><div class="gt">📣 ${x.m}</div><div class="body-copy">${x.body}</div></div>`).join('')}
    `;

    show('s1', 's2');
    $('#sApply').addEventListener('click', () => {
      const box = $('#sReply');
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="gen" style="border-color:var(--cyan-dim);">
          <div class="gt">📨 応募者への一次返信（自動下書き）</div>
          <div class="body-copy">この度はご応募ありがとうございます、株式会社◯◯です。\n${role.label}の件、ぜひ一度お話しさせてください。\n下記のいずれかで面接はいかがでしょうか。\n\n・今週 木 14:00〜\n・今週 金 10:00〜\n・来週 火 16:00〜\n\nご都合の良い時間をお知らせください。服装は普段着で大丈夫です。</div>
        </div>
        <div class="gen"><div class="gt">🗓 社長への通知</div><p style="color:var(--text);">「${role.label}に応募1件。候補日3つで返信済み。返事が来たらお知らせします」</p></div>
        <p class="footnote">※面接候補日は空き時間から自動提案（デモは固定）。応募の取りこぼし・返信遅れを無くすのが狙い。</p>`;
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#sHome').addEventListener('click', () => { location.hash = '#/'; });
    $('#sReplay').addEventListener('click', () => renderSaiyo(root));
    window.scrollTo(0, 0);
  }
}

/* =========================================================
   実演③ 広報のトオル — 説明動画の台本・絵コンテ
   ========================================================= */
const KOHO_USE = [
  { id: 'saiyo', label: '採用向け', oc: '🧑‍🔧', desc: '働く人・職場の空気を見せる' },
  { id: 'kyaku', label: 'お客様向け', oc: '🏠', desc: '安心して任せてもらう' },
  { id: 'jisseki', label: '施工実績', oc: '✨', desc: 'Before/Afterで実力を見せる' },
];
const KOHO_LEN = [
  { id: 30, label: '30秒', oc: '⚡' },
  { id: 60, label: '60秒', oc: '🎯' },
  { id: 90, label: '90秒', oc: '📖' },
];
const KOHO_STEPS = [
  { ic: '1', lbl: '狙いと構成を設計', key: 'plan' },
  { ic: '2', lbl: '最初の3秒(つかみ)', key: 'hook' },
  { ic: '3', lbl: 'シーン割り(カット)', key: 'scene' },
  { ic: '4', lbl: 'ナレーション原稿', key: 'narr' },
  { ic: '5', lbl: 'テロップ・BGM提案', key: 'telop' },
];

function renderKoho(root) {
  const e = EMP.koho;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="v0">
      <h2>① どんな説明動画を作る？</h2>
      <p class="sub">用途と尺を選ぶだけ。トオルが台本と絵コンテを組みます。</p>
      <div class="fieldlabel"><span class="q">1</span>動画の用途</div>
      <div class="opts" id="vUse"></div>
      <div class="fieldlabel"><span class="q">2</span>長さ</div>
      <div class="opts" id="vLen"></div>
      <button class="btn btn-primary btn-block mt20" id="vStart" disabled>この内容で台本を作らせる</button>
    </div>
    <div class="stage hidden" id="v1">
      <h2>② トオルが構成中 <span style="font-size:12px;color:var(--text-dim);font-family:-apple-system,sans-serif;">— 頭の中を見せます</span></h2>
      <div class="brain">
        <div class="bh"><span class="dotlive"></span>AIの作業ログ（リアルタイム）</div>
        <div class="steps" id="vSteps"></div>
        <div class="livemsg" id="vLive"></div>
      </div>
    </div>
    <div class="stage hidden" id="v2">
      <h2>③ 絵コンテ＋ナレーションができました</h2>
      <p class="sub">この通りに撮るだけ。スマホ撮影でも成立するカット割りにしています。</p>
      <div id="vMeta"></div>
      <div class="gen"><div class="gt">🎬 絵コンテ（カットごと）</div><div id="vScenes"></div></div>
      <div class="gen"><div class="gt">🎤 ナレーション全文（読み上げ用）</div><div class="body-copy" id="vNarr"></div></div>
      <div class="gen"><div class="gt">🎥 撮影メモ</div><div id="vShoot"></div></div>
      <div class="cta mt20" style="margin-left:0;margin-right:0;">
        <h2>「企画が出せない」が無くなります</h2>
        <p>構成・台本の外注 数万円/2週間 → 数分・自社で。撮影は手持ちスマホでOK。※仮試算。</p>
        <button class="btn btn-primary btn-block" id="vHome">他の社員を見る</button>
        <button class="btn btn-ghost btn-block mt12" id="vReplay">条件を変えてやり直す</button>
      </div>
    </div>
  `;

  let use = null, len = null;
  const useWrap = $('#vUse'), lenWrap = $('#vLen');
  KOHO_USE.forEach((u) => {
    const b = h(`<button class="opt" data-id="${u.id}"><span class="oc">${u.oc}</span>${u.label}</button>`);
    b.addEventListener('click', () => { use = u; $$('.opt', useWrap).forEach((x) => x.classList.toggle('sel', x === b)); upd(); });
    useWrap.appendChild(b);
  });
  KOHO_LEN.forEach((l) => {
    const b = h(`<button class="opt" data-id="${l.id}"><span class="oc">${l.oc}</span>${l.label}</button>`);
    b.addEventListener('click', () => { len = l; $$('.opt', lenWrap).forEach((x) => x.classList.toggle('sel', x === b)); upd(); });
    lenWrap.appendChild(b);
  });
  const upd = () => { $('#vStart').disabled = !(use && len); };

  $('#vSteps').innerHTML = KOHO_STEPS.map((s) => `<div class="stp" data-key="${s.key}"><div class="ic">${s.ic}</div><div class="lbl">${s.lbl}</div><div class="bar"><i></i></div></div>`).join('');
  const setStep = (key, st) => $$('#vSteps .stp').forEach((el) => { if (el.dataset.key === key) { el.classList.remove('active', 'done'); el.classList.add(st); } });
  const bar = (key, pct) => { const el = $(`#vSteps .stp[data-key="${key}"] .bar > i`); if (el) el.style.width = pct + '%'; };
  const say = (m) => { $('#vLive').textContent = m; };

  $('#vStart').addEventListener('click', () => { show('v0', 'v1'); after(250, () => runV(use, len)); });

  function runV(use, len) {
    const seq = [
      ['plan', `${use.label}・${len.label}。「${use.desc}」を軸に構成を決定`, 600],
      ['hook', '離脱させない最初の3秒を作成中…', 700],
      ['scene', `${len.id === 30 ? 4 : len.id === 60 ? 5 : 6}カットに割り付け中…`, 800],
      ['narr', '職人の言葉に近い語り口でナレーションを執筆…', 800],
      ['telop', '読みやすいテロップとBGMの雰囲気を提案…', 600],
    ];
    let t = 0;
    seq.forEach(([key, msg, dur]) => {
      after(t, () => { setStep(key, 'active'); say(msg); });
      for (let s = 1; s <= 8; s++) after(t + dur * s / 8, () => bar(key, Math.round(s / 8 * 100)));
      after(t + dur, () => setStep(key, 'done'));
      t += dur;
    });
    after(t + 300, () => { say('完成。この絵コンテ通りに撮ればOKです。'); showVResult(use, len); });
  }

  function showVResult(use, len) {
    const S = KOHO_SCRIPT[use.id];
    const count = len.id === 30 ? 4 : len.id === 60 ? 5 : 6;
    const scenes = S.scenes.slice(0, count);
    $('#vMeta').innerHTML = `<div class="gen"><div class="gt">🎯 狙い<span class="pill">${use.label}・${len.label}</span></div><h4>${S.title}</h4><p>${S.aim}</p></div>`;
    $('#vScenes').innerHTML = scenes.map((sc, i) => `
      <div class="scene">
        <div class="frame">${sc.icon}<span class="cut">CUT ${i + 1}</span></div>
        <div class="sbody">
          <div class="cap">${sc.cap}</div>
          <div class="narr">🎤「${sc.narr}」</div>
          <div class="telop">▏テロップ: ${sc.telop}</div>
        </div>
      </div>`).join('');
    $('#vNarr').textContent = scenes.map((s) => s.narr).join('\n');
    $('#vShoot').innerHTML = S.shoot.map((s) => `<div class="kv"><span class="k">${s.k}</span><span>${s.v}</span></div>`).join('') + `<div class="kv"><span class="k">BGM</span><span>${S.bgm}</span></div>`;

    show('v1', 'v2');
    $('#vHome').addEventListener('click', () => { location.hash = '#/'; });
    $('#vReplay').addEventListener('click', () => renderKoho(root));
    window.scrollTo(0, 0);
  }
}

const KOHO_SCRIPT = {
  saiyo: {
    title: '「ここで働きたい」と思わせる採用動画',
    aim: '仕事のやりがいと職場の空気を、飾らず見せて応募のハードルを下げる。',
    scenes: [
      { icon: '🌅', cap: '朝、現場に集合', narr: '朝8時。今日も、街の家を守りに行く。', telop: '外装リフォーム ◯◯塗装' },
      { icon: '🎨', cap: '職人の手元アップ', narr: '見て覚えろ、なんて言わない。手順はちゃんと教えます。', telop: '未経験スタート、多数' },
      { icon: '🤝', cap: '先輩と新人の会話', narr: 'わからないことは、聞けばいい。それが普通の会社です。', telop: '週休2日／直行直帰OK' },
      { icon: '🏠', cap: '完成した家×家族', narr: '自分が塗った家が、街に残る。', telop: '手に職をつけよう' },
      { icon: '📱', cap: '応募方法テロップ', narr: 'まずは、話を聞きに来てください。', telop: 'プロフィールから応募' },
      { icon: '✨', cap: 'ロゴ＋連絡先', narr: '仲間を、探しています。', telop: '◯◯塗装｜採用募集中' },
    ],
    shoot: [
      { k: '撮影', v: 'スマホ横向き・手ブレ補正ON。朝〜完成まで1日密着で素材が揃う' },
      { k: '出演', v: '若手職人1名＋ベテラン1名。台詞は棒読みでOK（テロップで補う）' },
      { k: '尺配分', v: '1カット4〜8秒。最後の応募導線は長めに' },
    ],
    bgm: '前向き・アコースティック（フリー音源で可）',
  },
  kyaku: {
    title: 'お客様に安心して任せてもらう説明動画',
    aim: '「どこに頼めばいいか分からない」不安を、工程と人柄の見える化で解消する。',
    scenes: [
      { icon: '🏠', cap: '築年数の経った外壁', narr: 'その外壁の色あせ、放っておくと家の寿命を縮めます。', telop: '外壁は10年で塗り替えどき' },
      { icon: '🔍', cap: '無料診断の様子', narr: 'まずは無料で、家の状態を診ます。', telop: '診断・お見積り無料' },
      { icon: '🎨', cap: '塗装工程 早回し', narr: '高圧洗浄から仕上げまで、工程は全部お見せします。', telop: '工程を写真で毎日報告' },
      { icon: '🤝', cap: '職人の挨拶', narr: '担当する職人の顔が、最初から見える会社です。', telop: '自社職人が対応' },
      { icon: '✨', cap: 'Before/After', narr: '新築みたいになった、とよく言われます。', telop: '施工実績◯◯件' },
      { icon: '📞', cap: '連絡先テロップ', narr: 'まずは気軽に、ご相談ください。', telop: 'お気軽にどうぞ' },
    ],
    shoot: [
      { k: '撮影', v: '既存の施工写真・現場動画の使い回しでほぼ作れる' },
      { k: '出演', v: '社長 or 職人が一言だけ話すと信頼感が段違い' },
      { k: '尺配分', v: '不安→解消→実績→導線 の順を崩さない' },
    ],
    bgm: '穏やか・安心感（ピアノ系フリー音源）',
  },
  jisseki: {
    title: '実力が一目で伝わる施工実績動画',
    aim: 'Before/Afterのインパクトで、言葉より先に「上手い」を伝える。',
    scenes: [
      { icon: '🏚️', cap: 'Before（色あせ・汚れ）', narr: '施工前。', telop: 'BEFORE' },
      { icon: '🎨', cap: '施工中カット', narr: '丁寧に、下地から。', telop: '3度塗り仕上げ' },
      { icon: '🏠', cap: 'After（艶のある外壁）', narr: '施工後。', telop: 'AFTER' },
      { icon: '📊', cap: '工期・仕様テロップ', narr: '工期◯日、シリコン塗装。', telop: '施工内容を明記' },
      { icon: '⭐', cap: 'お客様の声', narr: '「頼んで良かった」の一言が、全部です。', telop: 'お客様の声' },
      { icon: '✨', cap: 'ロゴ＋実績数', narr: '次は、あなたの家を。', telop: '施工実績◯◯件' },
    ],
    shoot: [
      { k: '撮影', v: '同じ画角のBefore/Afterが命。三脚 or 同じ立ち位置で撮る' },
      { k: '出演', v: '不要。写真スライドでも成立' },
      { k: '尺配分', v: 'Before→After の切り替えを一番の見せ場に' },
    ],
    bgm: 'スタイリッシュ・軽快（切り替え強調）',
  },
};

/* =========================================================
   実演④ 事務のサキ — 見積書・請求書の自動作成
   ========================================================= */
const SEIKYU_MENU = {
  gaiheki: {
    label: '外壁塗装', area: 120,
    items: [
      { n: '仮設足場', q: '120㎡', u: 800, sub: 96000 },
      { n: '高圧洗浄', q: '120㎡', u: 250, sub: 30000 },
      { n: '養生', q: '一式', u: 0, sub: 25000 },
      { n: '下地補修（ひび・シール）', q: '一式', u: 0, sub: 40000 },
      { n: '外壁塗装 シリコン3回塗り', q: '120㎡', u: 2300, sub: 276000 },
      { n: '付帯部塗装（軒天・雨樋等）', q: '一式', u: 0, sub: 45000 },
      { n: '諸経費', q: '一式', u: 0, sub: 30000 },
    ],
  },
  yane: {
    label: '屋根塗装', area: 80,
    items: [
      { n: '仮設足場', q: '120㎡', u: 800, sub: 96000 },
      { n: '屋根 高圧洗浄', q: '80㎡', u: 300, sub: 24000 },
      { n: '下地補修・縁切り', q: '一式', u: 0, sub: 35000 },
      { n: '屋根塗装 遮熱3回塗り', q: '80㎡', u: 2800, sub: 224000 },
      { n: '諸経費', q: '一式', u: 0, sub: 25000 },
    ],
  },
  set: {
    label: '外壁＋屋根セット', area: 200,
    items: [
      { n: '仮設足場', q: '120㎡', u: 800, sub: 96000 },
      { n: '高圧洗浄（外壁・屋根）', q: '200㎡', u: 270, sub: 54000 },
      { n: '養生', q: '一式', u: 0, sub: 30000 },
      { n: '下地補修一式', q: '一式', u: 0, sub: 60000 },
      { n: '外壁塗装 シリコン3回', q: '120㎡', u: 2300, sub: 276000 },
      { n: '屋根塗装 遮熱3回', q: '80㎡', u: 2800, sub: 224000 },
      { n: '付帯部塗装', q: '一式', u: 0, sub: 45000 },
      { n: '諸経費', q: '一式', u: 0, sub: 35000 },
    ],
  },
};
const SEIKYU_STEPS = [
  { ic: '1', lbl: '工事を項目に分解', key: 'split' },
  { ic: '2', lbl: '数量×単価を積算', key: 'calc' },
  { ic: '3', lbl: '値引き・消費税を計算', key: 'tax' },
  { ic: '4', lbl: '請求書に変換（インボイス）', key: 'inv' },
];
function renderSeikyu(root) {
  const e = EMP.seikyu;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="se0">
      <h2>① どの工事の見積り？</h2>
      <p class="sub">工事メニューを選ぶだけ。サキが項目を分解して見積書・請求書を作ります。<br>(宛先はデモ用に「田中様」固定・戸建て2階想定)</p>
      <div class="fieldlabel"><span class="q">1</span>工事メニュー</div>
      <div class="opts" id="seMenu"></div>
      <button class="btn btn-primary btn-block mt20" id="seStart" disabled>この工事の見積書を作らせる</button>
    </div>
    <div class="stage hidden" id="se1">
      <h2>② サキが作成中 <span style="font-size:12px;color:var(--text-dim);font-family:-apple-system,sans-serif;">— 計算も丸見え</span></h2>
      <div id="seSteps"></div>
    </div>
    <div class="stage hidden" id="se2">
      <h2>③ 見積書・請求書ができました</h2>
      <p class="sub">項目・数量・税・インボイス番号まで自動。あとは<b style="color:#fff;">確認して送るだけ</b>。</p>
      <div id="seOut"></div>
      <div class="impact mt16">
        <div class="cell human"><div class="lab">Excelで<br>手作り</div><div class="val">約30<small>分</small></div></div>
        <div class="cell"><div class="lab">サキの<br>作成</div><div class="val">約5<small>秒</small></div></div>
        <div class="cell you"><div class="lab">あなたの<br>確認</div><div class="val">約1<small>分</small></div></div>
      </div>
      <p class="footnote">金額ミス・出し忘れ・インボイス番号漏れが消えます。※金額・数値は仮の例です。</p>
      <div id="seCta"></div>
    </div>`;

  const menuWrap = $('#seMenu'); let menu = null;
  Object.entries(SEIKYU_MENU).forEach(([id, m]) => {
    const b = h(`<button class="opt" data-id="${id}">${m.label}</button>`);
    b.addEventListener('click', () => { menu = id; $$('.opt', menuWrap).forEach((x) => x.classList.toggle('sel', x === b)); $('#seStart').disabled = false; });
    menuWrap.appendChild(b);
  });
  $('#seSteps').innerHTML = stepsUI(SEIKYU_STEPS);
  $('#seStart').addEventListener('click', () => {
    show('se0', 'se1');
    const m = SEIKYU_MENU[menu];
    after(250, () => runSteps($('#se1'), [
      ['split', `「${m.label}」を${m.items.length}項目に分解…`, 600],
      ['calc', '足場・洗浄・塗装…数量×単価を積算中…', 800],
      ['tax', '端数値引きと消費税10%を計算…', 600],
      ['inv', 'インボイス番号・振込先・支払期日を差し込み…', 600],
    ], () => showSeResult(m)));
  });

  function showSeResult(m) {
    const subtotal = m.items.reduce((a, x) => a + x.sub, 0);
    const discount = 12000;
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * 0.1);
    const total = taxable + tax;
    const rows = m.items.map((x) => `<div class="kv"><span class="k">${x.n}</span><span style="margin-left:auto;">${x.q}${x.u ? ` × ${yen(x.u)}` : ''}</span><span style="min-width:76px;text-align:right;color:#fff;">${yen(x.sub)}</span></div>`).join('');
    $('#seOut').innerHTML = `
      <div class="gen">
        <div class="gt">📄 御見積書<span class="pill">田中様</span></div>
        <h4>${m.label}工事 御見積</h4>
        <div class="divider"></div>
        ${rows}
        <div class="divider"></div>
        <div class="kv"><span class="k">小計</span><span style="margin-left:auto;color:#fff;">${yen(subtotal)}</span></div>
        <div class="kv"><span class="k">出精値引き</span><span style="margin-left:auto;color:var(--warn);">-${yen(discount)}</span></div>
        <div class="kv"><span class="k">消費税(10%)</span><span style="margin-left:auto;color:#fff;">${yen(tax)}</span></div>
        <div class="kv" style="font-size:16px;margin-top:6px;"><span class="k" style="color:var(--cyan);">お見積金額</span><span style="margin-left:auto;color:var(--cyan);font-weight:800;">${yen(total)}</span></div>
      </div>
      <div class="gen" style="border-color:var(--cyan-dim);">
        <div class="gt">🧾 御請求書（見積確定で自動変換）</div>
        <div class="kv"><span class="k">請求金額</span><span style="color:#fff;font-weight:700;">${yen(total)}（税込）</span></div>
        <div class="kv"><span class="k">支払期日</span><span>翌月末</span></div>
        <div class="kv"><span class="k">登録番号</span><span>T1234567890123</span></div>
        <div class="kv"><span class="k">振込先</span><span>◯◯銀行 △△支店 普通 1234567</span></div>
        <p class="footnote" style="text-align:left;margin-left:0;">※インボイス登録番号・振込先はマスタから自動挿入（デモは仮）。</p>
      </div>`;
    $('#seCta').innerHTML = demoCta('経理のジローと繋げば入金消込まで', '発行した請求書の入金チェックも自動で追えます。', '別メニューでやり直す');
    show('se1', 'se2');
    wireDemoCta(root, () => renderSeikyu(root));
  }
}

/* =========================================================
   実演⑤ 現場のケン — 施工写真の整理・Before/After報告書
   ========================================================= */
const KOTEI_STYLE = {
  '施工前': 'linear-gradient(160deg,#6b5b4a,#3a3128)',
  '高圧洗浄': 'linear-gradient(160deg,#4b6b86,#26384a)',
  '下地補修': 'linear-gradient(160deg,#7a6a52,#40382b)',
  '下塗り': 'linear-gradient(160deg,#8a7d6b,#4a4335)',
  '中塗り・上塗り': 'linear-gradient(160deg,#5f7a6a,#33403a)',
  '完了': 'linear-gradient(160deg,#4a7a86,#26424a)',
};
const GENBA_PHOTOS = [
  { id: 1, k: '施工前', d: '6/3', p: '南面全景', conf: 98 },
  { id: 2, k: '高圧洗浄', d: '6/4', p: '南面', conf: 96 },
  { id: 3, k: '下地補修', d: '6/5', p: 'ひび割れ部', conf: 94 },
  { id: 4, k: '下塗り', d: '6/6', p: '西面', conf: 70, need: true, guess: '中塗り・上塗り', alt: ['下塗り', '中塗り・上塗り'] },
  { id: 5, k: '中塗り・上塗り', d: '6/7', p: '南面', conf: 93 },
  { id: 6, k: '中塗り・上塗り', d: '6/8', p: '東面', conf: 91 },
  { id: 7, k: '完了', d: '6/9', p: '南面全景', conf: 97 },
  { id: 8, k: '完了', d: '6/9', p: '付帯部', conf: 90 },
];
const KOTEI_ORDER = ['施工前', '高圧洗浄', '下地補修', '下塗り', '中塗り・上塗り', '完了'];
const GENBA_STEPS = [
  { ic: '1', lbl: '写真を読み込み', key: 'load' },
  { ic: '2', lbl: '工程を判定', key: 'kind' },
  { ic: '3', lbl: '日付・面を読み取り', key: 'ocr' },
  { ic: '4', lbl: 'Before/After報告書を作成', key: 'rep' },
];
function tile(p, tagged) {
  const visual = p.url
    ? `<img src="${p.url}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`
    : `<div style="position:absolute;inset:0;background:${KOTEI_STYLE[p.k] || '#333'}"></div>`;
  return `<div class="ph ${tagged ? 'tagged' : ''}" data-id="${p.id}" style="position:relative;aspect-ratio:4/3;border-radius:9px;overflow:hidden;border:1px solid var(--navy-lighter);display:flex;align-items:flex-end;">
    ${visual}
    ${tagged ? `<div style="position:relative;width:100%;padding:3px 5px;font-size:9px;background:linear-gradient(0deg,rgba(5,7,15,.92),transparent);z-index:2;"><span style="color:var(--cyan);font-weight:700;">${p.k}</span><br><span style="color:var(--text-dim);font-size:8px;">${p.d}</span></div>` : ''}
  </div>`;
}
// サンプルの作業コピー(元配列は不変に保つ)
function genbaSample() { return GENBA_PHOTOS.map((p) => ({ ...p })); }
function fmtFileDate(ms) { try { const d = new Date(ms); return (d.getMonth() + 1) + '/' + d.getDate(); } catch (e) { return '—'; } }
// アップロードされた実写真に、それっぽい工程ラベルを割当てる(オフライン演出。実分類はしない)
function genbaFromFiles(files) {
  const list = files.slice(0, 12).map((f, i) => ({ id: i + 1, url: URL.createObjectURL(f), d: fmtFileDate(f.lastModified), p: 'お客様の写真' }));
  const N = list.length;
  const mids = ['高圧洗浄', '下地補修', '下塗り', '中塗り・上塗り'];
  list.forEach((p, i) => {
    p.k = (i === 0) ? '施工前' : (i === N - 1) ? '完了' : mids[(i - 1) % mids.length];
    p.conf = 88 + ((i * 3) % 10);
  });
  // AIも初見 → 中間から最大3枚を「要確認」に(正直に多めに聞く演出)
  const middle = list.filter((_, i) => i > 0 && i < N - 1);
  const needN = Math.min(3, middle.length);
  for (let j = 0; j < needN; j++) {
    const p = middle[Math.floor(j * middle.length / needN)];
    p.need = true; p.conf = 62 + j * 5;
    const idx = KOTEI_ORDER.indexOf(p.k);
    const g = KOTEI_ORDER[idx + 1] || KOTEI_ORDER[idx - 1] || p.k;
    p.guess = g; p.alt = Array.from(new Set([p.k, g]));
  }
  return list;
}
function renderGenba(root) {
  const e = EMP.genba;
  setBar({ back: true, title: e.name });
  let mode = 'sample';
  let photos = genbaSample();
  const gkResolved = new Set();
  const revokeUrls = () => photos.forEach((p) => { if (p.url) { try { URL.revokeObjectURL(p.url); } catch (x) {} } });

  root.innerHTML = workerHead(e) + `
    <div class="stage" id="gk0">
      <h2>① 現場の写真を、そのまま投入</h2>
      <p class="sub">工程順に並べ替えなくてOK。ケンが工程を判定して整理し、お客様向け報告書にします。</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;" id="gkPile"></div>
      <button class="btn btn-primary btn-block mt16" id="gkStart">サンプル8枚で実演する</button>
      <div style="text-align:center;color:var(--text-faint);font-size:12px;margin:14px 0 10px;">— または —</div>
      <label class="btn btn-ghost btn-block" style="display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;">
        📷 自分の現場写真でやってみる
        <input type="file" id="gkFile" accept="image/*" multiple style="display:none;">
      </label>
      <p class="footnote" style="margin-top:8px;">スマホなら撮影 or カメラロールから複数選べます。写真は<b style="color:var(--text-dim);">この端末の中だけ</b>で処理され、どこにも送信しません。</p>
    </div>
    <div class="stage hidden" id="gk1">
      <h2>② ケンが整理中 <span style="font-size:12px;color:var(--text-dim);font-family:-apple-system,sans-serif;">— 判定を実況</span></h2>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;" id="gkWork"></div>
      <div id="gkSteps"></div>
    </div>
    <div class="stage hidden" id="gk2">
      <h2>③ 工程台帳＋Before/After報告書が完成</h2>
      <p class="sub">工程ごとに整理し、施工前と完了を並べた報告書を自動生成しました。</p>
      <div class="review" id="gkReview">
        <h3>要確認</h3>
        <p class="rsub">ケンが迷った写真です。正しい工程をタップしてください。</p>
        <div id="gkReviewList"></div>
      </div>
      <div class="gen mt16"><div class="gt">📒 工程台帳（自動整理）</div><div id="gkLedger"></div></div>
      <div class="gen" style="border-color:var(--cyan-dim);"><div class="gt">📰 お客様向け Before / After 報告書</div><div id="gkReport"></div></div>
      <div id="gkCta"></div>
    </div>`;

  const renderPile = () => { $('#gkPile').innerHTML = photos.map((p) => tile(p, false)).join(''); };
  renderPile();
  $('#gkSteps').innerHTML = stepsUI(GENBA_STEPS);

  $('#gkFile').addEventListener('change', (ev) => {
    const files = Array.from(ev.target.files || []);
    if (!files.length) return;
    revokeUrls();
    photos = genbaFromFiles(files);
    mode = 'upload';
    gkResolved.clear();
    renderPile();
    $('#gkStart').textContent = `この写真で整理させる（${photos.length}枚）`;
    $('#gkPile').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  $('#gkStart').addEventListener('click', () => {
    show('gk0', 'gk1');
    $('#gkWork').innerHTML = photos.map((p) => tile(p, false)).join('');
    const N = photos.length;
    const stepGap = Math.max(90, Math.min(180, Math.round(1400 / Math.max(N, 1))));
    after(250, () => {
      after(700, () => photos.forEach((p, i) => after(stepGap * i, () => {
        const t2 = $(`#gkWork .ph[data-id="${p.id}"]`); if (t2) t2.outerHTML = tile(p, true);
      })));
      runSteps($('#gk1'), [
        ['load', `${N}枚を読み込み…`, 500],
        ['kind', mode === 'upload' ? 'お客様の写真を1枚ずつ工程判定中…' : '施工前／洗浄／下地／塗り／完了 を判定中…', 1600],
        ['ocr', mode === 'upload' ? '撮影日・面を読み取り…' : '黒板の日付・面を読み取り…', 700],
        ['rep', '施工前と完了を並べて報告書を作成…', 700],
      ], showGkResult);
    });
  });

  function showGkResult() {
    const needs = photos.filter((p) => p.need);
    $('#gkReview h3').textContent = `要確認 — ${needs.length}件`;
    $('#gkReview .rsub').textContent = mode === 'upload'
      ? 'アップした写真はケンも初見です。自信のない所は隠さず、正直に確認へ回します。正しい工程をタップしてください。'
      : 'ケンが迷った写真です。正しい工程をタップしてください。';
    $('#gkReview').classList.toggle('hidden', needs.length === 0);
    $('#gkReviewList').innerHTML = needs.map((p) => `
      <div class="review-item" data-id="${p.id}">
        <div class="rq">写真#${p.id}（${p.d}／${p.p}）<br>ケンの予想: <b>${p.guess}</b>…自信${p.conf}%。どっち？</div>
        <div class="opts">${p.alt.map((a) => `<button class="opt" data-id="${p.id}" data-k="${a}">${a}</button>`).join('')}</div>
      </div>`).join('');
    renderLedger();
    renderReport();
    show('gk1', 'gk2');
    $$('#gkReviewList .opt').forEach((btn) => btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const p = photos.find((x) => x.id === id); if (p) p.k = btn.dataset.k;
      gkResolved.add(id);
      const item = $(`.review-item[data-id="${id}"]`);
      $$('.opt', item).forEach((b) => b.classList.toggle('sel', b === btn));
      item.classList.add('resolved');
      renderLedger();
    }));
    const ctaSub = mode === 'upload'
      ? 'いま御社の写真でこれが動きました。毎現場、報告書が夜の事務所仕事から外れます。'
      : 'お客様提出も、写真の整理も、夜の事務所仕事から外れます。';
    $('#gkCta').innerHTML = demoCta('毎現場、報告書が勝手に片付く', ctaSub, 'もう一度、実演を見る');
    wireDemoCta(root, () => { revokeUrls(); renderGenba(root); });
  }
  function renderLedger() {
    $('#gkLedger').innerHTML = KOTEI_ORDER.map((k) => {
      // 未確認の need 写真は台帳に載せない(確認して初めて振り分けられる)
      const ps = photos.filter((p) => p.k === k && (!p.need || gkResolved.has(p.id)));
      if (!ps.length) return '';
      return `<div class="kv"><span class="k" style="color:var(--cyan);">${k}</span><span style="margin-left:auto;color:var(--text-dim);">${ps.length}枚</span><span style="min-width:20px;text-align:right;color:var(--ok);">✓</span></div>`;
    }).join('');
  }
  function renderReport() {
    const before = photos.find((p) => p.k === '施工前') || photos[0];
    const after2 = photos.find((p) => p.k === '完了') || photos[photos.length - 1];
    const frame = (p, label, ls, gradKey) => `<div style="aspect-ratio:4/3;border-radius:9px;position:relative;overflow:hidden;${p && p.url ? '' : `background:${KOTEI_STYLE[gradKey]};`}">${p && p.url ? `<img src="${p.url}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">` : ''}<span style="position:absolute;top:6px;left:6px;font-size:10px;font-weight:700;${ls};padding:2px 8px;border-radius:6px;">${label}</span></div>`;
    const body = (mode === 'upload')
      ? 'お客様の現場写真を、施工前から完了まで工程ごとに整理しました。この形の報告書が、毎現場そのまま提出できます。'
      : '田中様邸 外壁塗装工事の施工報告です。高圧洗浄から下地補修、シリコン3回塗りまで、工程ごとに写真で記録しました。全工程を予定通り完了しております。';
    $('#gkReport').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div>${frame(before, 'BEFORE', 'color:#fff;background:rgba(5,7,15,.6)', '施工前')}<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">施工前（${before ? before.d : '—'}）</div></div>
        <div>${frame(after2, 'AFTER', 'color:#0B0E19;background:var(--cyan)', '完了')}<div style="font-size:11px;color:var(--cyan);margin-top:4px;">完了（${after2 ? after2.d : '—'}）</div></div>
      </div>
      <p style="font-size:12.5px;color:var(--text);line-height:1.8;">${body}</p>`;
  }
}

/* =========================================================
   実演⑥ 育成のトモ — 手順書・チェックリスト生成
   ========================================================= */
const IKUSEI_TASKS = {
  senjo: {
    label: '高圧洗浄', oc: '💧',
    steps: [
      { t: '周囲・近隣を養生で保護', cut: '養生前後の全景', ng: '飛散で近隣クレーム' },
      { t: '水圧を素材に合わせて設定（窯業サイディングは中圧）', cut: 'ガン設定の手元', ng: '高圧すぎて表面を傷める' },
      { t: '上から下へ、汚れ・チョーキングを落とす', cut: '洗浄中の面', ng: '塗り替え後の早期剥離' },
      { t: '完全乾燥まで24時間おく', cut: '乾燥待ちの記録', ng: '生乾きで塗ると密着不良' },
    ],
  },
  yojo: {
    label: '養生', oc: '📏',
    steps: [
      { t: '窓・サッシ・設備をマスカーで覆う', cut: '養生後の窓周り', ng: '塗料付着で追加清掃' },
      { t: '地面・植栽・車をブルーシートで保護', cut: '足元の養生', ng: '飛散で弁償トラブル' },
      { t: '塗る際の見切りラインをテープで直線に', cut: '見切りの拡大', ng: '仕上がりがガタつく' },
      { t: '剥がすタイミングは塗料が半乾きのうち', cut: '剥がし作業', ng: '乾き切ると塗膜が裂ける' },
    ],
  },
  shitanuri: {
    label: '下塗り', oc: '🪣',
    steps: [
      { t: '素材に合った下塗り材を選ぶ（シーラー/フィラー）', cut: '缶のラベル', ng: '上塗りが密着しない' },
      { t: '既定の希釈率を守って撹拌', cut: '撹拌の様子', ng: 'ムラ・性能低下' },
      { t: '吸い込みの激しい面は2回下塗り', cut: '2回塗り箇所', ng: '色ムラ・艶引け' },
      { t: '規定の乾燥時間を空けて中塗りへ', cut: '乾燥記録', ng: '塗膜不良' },
    ],
  },
};
const IKUSEI_STEPS = [
  { ic: '1', lbl: '作業を工程に分解', key: 'split' },
  { ic: '2', lbl: '順序と勘所を整理', key: 'order' },
  { ic: '3', lbl: '失敗例・注意点を付与', key: 'ng' },
  { ic: '4', lbl: 'チェックリスト化', key: 'check' },
];
function renderIkusei(root) {
  const e = EMP.ikusei;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="ik0">
      <h2>① どの作業を教える？</h2>
      <p class="sub">作業を選ぶだけで、新人がスマホで見る手順書とチェックリストにします。「見て覚えろ」を仕組みに。</p>
      <div class="fieldlabel"><span class="q">1</span>作業</div>
      <div class="opts" id="ikTask"></div>
      <button class="btn btn-primary btn-block mt20" id="ikStart" disabled>この作業の手順書を作らせる</button>
    </div>
    <div class="stage hidden" id="ik1">
      <h2>② トモが作成中</h2>
      <div id="ikSteps"></div>
    </div>
    <div class="stage hidden" id="ik2">
      <h2>③ 手順書＋チェックリストができました</h2>
      <p class="sub">新人はこれを見て予習、現場で確認。撮影カット指示付きなので手順動画にもできます。</p>
      <div id="ikOut"></div>
      <p class="footnote">教え方が人によってバラつかない＝新人の早期離職を防ぐ狙い。※内容は一般的な例。実際は自社のやり方に合わせて調整。</p>
      <div id="ikCta"></div>
    </div>`;
  const wrap = $('#ikTask'); let task = null;
  Object.entries(IKUSEI_TASKS).forEach(([id, t]) => {
    const b = h(`<button class="opt" data-id="${id}"><span class="oc">${t.oc}</span>${t.label}</button>`);
    b.addEventListener('click', () => { task = id; $$('.opt', wrap).forEach((x) => x.classList.toggle('sel', x === b)); $('#ikStart').disabled = false; });
    wrap.appendChild(b);
  });
  $('#ikSteps').innerHTML = stepsUI(IKUSEI_STEPS);
  $('#ikStart').addEventListener('click', () => {
    show('ik0', 'ik1');
    const t = IKUSEI_TASKS[task];
    after(250, () => runSteps($('#ik1'), [
      ['split', `「${t.label}」を${t.steps.length}ステップに分解…`, 600],
      ['order', '順序と、ベテランが見てる勘所を言語化…', 800],
      ['ng', 'よくある失敗例を各ステップに紐付け…', 700],
      ['check', '現場で使うチェックリストに変換…', 500],
    ], () => showIkResult(t)));
  });
  function showIkResult(t) {
    const steps = t.steps.map((s, i) => `
      <div class="scene">
        <div class="frame">${i + 1}<span class="cut">STEP</span></div>
        <div class="sbody">
          <div class="cap">${s.t}</div>
          <div class="narr">🎥 撮影: ${s.cut}</div>
          <div class="telop" style="color:var(--danger);">⚠ 失敗例: ${s.ng}</div>
        </div>
      </div>`).join('');
    const checks = t.steps.map((s) => `<label style="display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--navy-lighter);font-size:13px;color:var(--text);"><input type="checkbox" style="width:20px;height:20px;accent-color:var(--cyan);">${s.t}</label>`).join('');
    $('#ikOut').innerHTML = `
      <div class="gen"><div class="gt">📖 手順書（撮影カット付き）<span class="pill">${t.label}</span></div>${steps}</div>
      <div class="gen"><div class="gt">✅ 現場チェックリスト</div>${checks}</div>`;
    $('#ikCta').innerHTML = demoCta('新人が「見て覚える」に頼らない', '手順が形に残れば、教える側の時間も、辞める理由も減ります。', '別の作業でやり直す');
    show('ik1', 'ik2');
    wireDemoCta(root, () => renderIkusei(root));
  }
}

/* =========================================================
   実演⑦ 評判のミオ — Google口コミの返信下書き
   ========================================================= */
const KUCHIKOMI_SAMPLES = {
  good: {
    label: '高評価の口コミ', star: '★★★★★',
    text: '外壁の色あせが気になって依頼しました。職人さんが毎日どこまで進んだか写真で報告してくれて、仕上がりも新築みたいで大満足です。近所にも勧めたいです。',
  },
  mid: {
    label: 'ちょい辛口の口コミ', star: '★★★☆☆',
    text: '仕上がりは良かったのですが、作業中の車の停め方が少し気になりました。工事自体は丁寧だったと思います。',
  },
  bad: {
    label: '低評価の口コミ', star: '★★☆☆☆',
    text: '見積もりより追加費用がかかると言われ、説明が後出しに感じました。工事の質は悪くないですが、その点だけ残念です。',
  },
};
const KUCHIKOMI_STEPS = [
  { ic: '1', lbl: '口コミの意図を読む', key: 'read' },
  { ic: '2', lbl: '触れるべき事実を抽出', key: 'fact' },
  { ic: '3', lbl: '会社のトーンで返信', key: 'tone' },
  { ic: '4', lbl: '角が立たない表現に調整', key: 'soft' },
];
function renderKuchikomi(root) {
  const e = EMP.kuchikomi;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="kk0">
      <h2>① どの口コミに返信する？</h2>
      <p class="sub">口コミを選ぶだけ。ミオが会社らしい返信を下書きします。低評価も冷静に一次対応。</p>
      <div class="opts" id="kkPick" style="flex-direction:column;"></div>
      <button class="btn btn-primary btn-block mt20" id="kkStart" disabled>この口コミに返信を書かせる</button>
    </div>
    <div class="stage hidden" id="kk1">
      <h2>② ミオが下書き中</h2>
      <div id="kkSteps"></div>
    </div>
    <div class="stage hidden" id="kk2">
      <h2>③ 返信の下書きができました</h2>
      <p class="sub">社長は<b style="color:#fff;">確認して投稿するだけ</b>。返信の後回しが無くなり、評価が育ちます。</p>
      <div id="kkOut"></div>
      <p class="footnote">口コミへの丁寧な返信は地図検索(MEO)にも効きます。※返信文はデモ生成の例。</p>
      <div id="kkCta"></div>
    </div>`;
  const wrap = $('#kkPick'); let pick = null;
  Object.entries(KUCHIKOMI_SAMPLES).forEach(([id, s]) => {
    const b = h(`<button class="opt" data-id="${id}" style="align-items:flex-start;text-align:left;width:100%;flex-direction:column;gap:5px;"><span style="color:var(--gold);font-size:12px;">${s.star} <span style="color:var(--text-dim);">${s.label}</span></span><span style="font-size:12px;color:var(--text-dim);line-height:1.6;font-weight:400;">${s.text}</span></button>`);
    b.addEventListener('click', () => { pick = id; $$('.opt', wrap).forEach((x) => x.classList.toggle('sel', x === b)); $('#kkStart').disabled = false; });
    wrap.appendChild(b);
  });
  $('#kkSteps').innerHTML = stepsUI(KUCHIKOMI_STEPS);
  $('#kkStart').addEventListener('click', () => {
    show('kk0', 'kk1');
    const s = KUCHIKOMI_SAMPLES[pick];
    after(250, () => runSteps($('#kk1'), [
      ['read', `${s.star} の口コミ。感謝か、不満か、意図を読む…`, 600],
      ['fact', '触れるべき具体（工程・担当）を抽出…', 700],
      ['tone', '丁寧で人間味のあるトーンで執筆…', 700],
      ['soft', '言い訳せず、角の立たない表現に調整…', 500],
    ], () => showKkResult(pick)));
  });
  function showKkResult(id) {
    const replies = {
      good: [
        { t: '丁寧版', body: 'この度は嬉しいお言葉をありがとうございます。毎日の進捗報告にご満足いただけて、担当した職人一同とても励みになります。外壁は年数が経つとまた気になる部分も出てまいりますので、その際もお気軽にご相談ください。ご近所へのご紹介まで、心より感謝申し上げます。' },
        { t: '簡潔版', body: '嬉しいお言葉をありがとうございます。仕上がりにご満足いただけて何よりです。またお困りの際はいつでもご相談ください。' },
      ],
      mid: [
        { t: '丁寧版', body: 'この度はご依頼、また率直なご感想をありがとうございます。仕上がりにご満足いただけた一方、作業車の駐車でご不便をおかけした点、申し訳ございませんでした。今後は近隣・お客様への駐車配慮を徹底してまいります。貴重なご指摘に感謝いたします。' },
      ],
      bad: [
        { t: '冷静な一次対応版', body: 'この度はご不快な思いをおかけし申し訳ございません。追加費用のご説明が後手に回ったとのこと、真摯に受け止めます。見積時点での説明の分かりやすさを改善してまいります。差し支えなければ、経緯を確認したく一度ご連絡をいただけますと幸いです。' },
      ],
    };
    const s = KUCHIKOMI_SAMPLES[id];
    $('#kkOut').innerHTML = `
      <div class="gen"><div class="gt">💬 元の口コミ</div><p style="color:var(--text);">${s.star} ${s.text}</p></div>
      ${replies[id].map((r) => `<div class="gen" style="border-color:var(--cyan-dim);"><div class="gt">✍️ 返信案（${r.t}）</div><div class="body-copy">${r.body}</div></div>`).join('')}`;
    $('#kkCta').innerHTML = demoCta('星が付く運用を、続けられる', '返信が溜まらない。評価が育つ。営業に困っていなくても効きます。', '別の口コミでやり直す');
    show('kk1', 'kk2');
    wireDemoCta(root, () => renderKuchikomi(root));
  }
}

/* =========================================================
   実演⑧ 見張り番のゲン — 補助金の監視
   ========================================================= */
const HOJOKIN_STEPS = [
  { ic: '1', lbl: '国・自治体の制度を巡回', key: 'crawl' },
  { ic: '2', lbl: '外装・断熱に該当を抽出', key: 'filter' },
  { ic: '3', lbl: '上限・締切を整理', key: 'org' },
  { ic: '4', lbl: '締切間近を通知', key: 'alert' },
];
const HOJOKIN_HITS = [
  { name: '住宅省エネ関連（断熱改修）', target: '外壁・屋根の断熱塗装／断熱改修', cap: '上限 数十万円規模', due: '通年（予算上限に達し次第終了）', state: 'watch', note: '予算消化が早い年がある。動くなら早めに。' },
  { name: '自治体の外壁・屋根塗装 助成', target: '対象地域の戸建て外壁・屋根塗装', cap: '工事費の一部（例:10〜20%）', due: '締切間近（残り目安あり）', state: 'soon', note: '地域限定・年度予算制。要項の対象要件を必ず確認。' },
  { name: '省エネリフォーム系 補助', target: '遮熱・断熱を伴う改修', cap: '要項による', due: '公募中', state: 'watch', note: '遮熱塗装が対象になる場合あり。仕様条件に注意。' },
];
function renderHojokin(root) {
  const e = EMP.hojokin;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="hj0">
      <h2>① 補助金の監視を始める</h2>
      <p class="sub">外壁・断熱・省エネ系の補助金は種類も締切もバラバラ。ゲンが常時見張って、使える案件と締切間近を教えます。</p>
      <div class="fieldlabel"><span class="q">1</span>対象エリア（デモは例）</div>
      <div class="opts" id="hjArea"></div>
      <button class="btn btn-primary btn-block mt20" id="hjStart" disabled>このエリアで監視を回す</button>
    </div>
    <div class="stage hidden" id="hj1">
      <h2>② ゲンが巡回中</h2>
      <div id="hjSteps"></div>
    </div>
    <div class="stage hidden" id="hj2">
      <h2>③ 使えそうな補助金が見つかりました</h2>
      <p class="sub">お客様提案の後押し材料にもなります。ただし<b style="color:var(--warn);">制度は毎年変わります</b>。実際の可否は必ず一次情報で確認を。</p>
      <div id="hjOut"></div>
      <div class="review" style="background:rgba(255,143,143,.06);border-color:rgba(255,143,143,.35);">
        <h3 style="color:var(--danger);">重要 — 断定はしません</h3>
        <p class="rsub" style="color:var(--text-dim);">補助金は年度・地域・仕様で要件が細かく変わります。ゲンは「候補の発見と締切の見張り」まで。申請可否・要件は公募要領や自治体窓口・専門家で必ず確認してください。</p>
      </div>
      <div id="hjCta"></div>
    </div>`;
  const areas = ['東京都◯◯市', '神奈川県◯◯市', '埼玉県◯◯市'];
  const wrap = $('#hjArea'); let area = null;
  areas.forEach((a) => {
    const b = h(`<button class="opt" data-a="${a}">${a}</button>`);
    b.addEventListener('click', () => { area = a; $$('.opt', wrap).forEach((x) => x.classList.toggle('sel', x === b)); $('#hjStart').disabled = false; });
    wrap.appendChild(b);
  });
  $('#hjSteps').innerHTML = stepsUI(HOJOKIN_STEPS);
  $('#hjStart').addEventListener('click', () => {
    show('hj0', 'hj1');
    after(250, () => runSteps($('#hj1'), [
      ['crawl', `${area} と国の制度ページを巡回…`, 800],
      ['filter', '外壁・屋根・断熱・遮熱の該当を抽出…', 700],
      ['org', '対象工事・上限・締切を表に整理…', 600],
      ['alert', '締切間近をピックアップ…', 500],
    ], showHjResult));
  });
  function showHjResult() {
    $('#hjOut').innerHTML = HOJOKIN_HITS.map((x) => {
      const badge = x.state === 'soon' ? '<span class="dkind lo">締切間近</span>' : '<span class="dkind hi">監視中</span>';
      return `<div class="gen"><div class="gt">🏛️ ${x.name} ${badge}</div>
        <div class="kv"><span class="k">対象工事</span><span>${x.target}</span></div>
        <div class="kv"><span class="k">補助上限</span><span>${x.cap}</span></div>
        <div class="kv"><span class="k">締切</span><span style="color:${x.state === 'soon' ? 'var(--warn)' : 'var(--text)'};">${x.due}</span></div>
        <p style="font-size:12px;color:var(--text-dim);margin-top:8px;line-height:1.7;">💡 ${x.note}</p></div>`;
    }).join('') + `<div class="gen" style="border-color:var(--cyan-dim);"><div class="gt">🗣 お客様提案メモ（自動）</div><p style="color:var(--text);">「今なら断熱・省エネ系の補助が使える可能性があります。対象になるか一緒に確認しましょう」— 見積提案に一言添えるだけで背中を押せます。</p></div>`;
    $('#hjCta').innerHTML = demoCta('締切の取りこぼしをゼロに', '補助金は「知ってたら使えた」の連続。見張りを任せれば逃しません。', '別エリアでやり直す');
    show('hj1', 'hj2');
    wireDemoCta(root, () => renderHojokin(root));
  }
}

/* =========================================================
   実演⑨ 電話番のリン — 電話の一次対応
   ========================================================= */
const DENWA_STEPS = [
  { ic: '1', lbl: '用件を聞き取り', key: 'listen' },
  { ic: '2', lbl: '住所・連絡先を確認', key: 'contact' },
  { ic: '3', lbl: '希望日時をヒアリング', key: 'when' },
  { ic: '4', lbl: '緊急度を判定→社長へ通知', key: 'notify' },
];
const DENWA_CONV = [
  { who: 'リン', t: 'お電話ありがとうございます、◯◯塗装です。' },
  { who: 'お客様', t: '外壁の見積もりをお願いしたくて。' },
  { who: 'リン', t: 'ありがとうございます。お住まいのご住所と、築年数はお分かりになりますか？' },
  { who: 'お客様', t: '◯◯市△△町の戸建てで、築15年くらいです。' },
  { who: 'リン', t: '承知しました。ご訪問でのお見積り、来週で言うといつ頃がご都合よろしいですか？' },
  { who: 'お客様', t: '平日の午前中が助かります。' },
  { who: 'リン', t: 'かしこまりました。担当より折り返しご連絡いたします。お名前を伺えますか？' },
  { who: 'お客様', t: '田中です。' },
];
function renderDenwa(root) {
  const e = EMP.denwa;
  setBar({ back: true, title: e.name });
  root.innerHTML = workerHead(e) + `
    <div class="stage" id="dn0">
      <h2>① 現場に出ていて、電話が鳴った</h2>
      <p class="sub">取り込み中でも取りこぼさない。リンが一次対応で用件を聞き取り、社長のスマホにメモを残します。</p>
      <button class="btn btn-primary btn-block mt16" id="dnStart">📞 電話がかかってきた（実演）</button>
    </div>
    <div class="stage hidden" id="dn1">
      <h2>② リンが応対中 <span style="font-size:12px;color:var(--text-dim);font-family:-apple-system,sans-serif;">— 会話も丸見え</span></h2>
      <div class="gen"><div class="gt">☎️ 通話（リアルタイム）</div><div id="dnConv" style="display:flex;flex-direction:column;gap:8px;"></div></div>
      <div id="dnSteps" class="mt16"></div>
    </div>
    <div class="stage hidden" id="dn2">
      <h2>③ 聞き取りメモ＋折返しリストが完成</h2>
      <p class="sub">社長は手が空いたときに<b style="color:#fff;">これを見て折り返すだけ</b>。取りこぼしと聞き漏れが消えます。</p>
      <div id="dnOut"></div>
      <p class="footnote">緊急（水漏れ等）は即転送、通常は折返しリストへ。※デモの会話は固定。</p>
      <div id="dnCta"></div>
    </div>`;
  $('#dnSteps').innerHTML = stepsUI(DENWA_STEPS);
  $('#dnStart').addEventListener('click', () => {
    show('dn0', 'dn1');
    const conv = $('#dnConv');
    DENWA_CONV.forEach((line, i) => after(700 * i + 300, () => {
      const me = line.who === 'リン';
      conv.appendChild(h(`<div style="align-self:${me ? 'flex-start' : 'flex-end'};max-width:82%;background:${me ? 'var(--navy-lighter)' : '#232B4A'};border:1px solid ${me ? 'var(--navy-lighter)' : 'var(--cyan-dim)'};border-radius:12px;padding:8px 11px;font-size:12.5px;color:${me ? 'var(--text)' : 'var(--cyan)'};line-height:1.6;"><b style="font-size:10px;color:var(--text-faint);">${line.who}</b><br>${line.t}</div>`));
      conv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }));
    after(700 * DENWA_CONV.length + 400, () => runSteps($('#dn1'), [
      ['listen', '用件:「外壁の見積り希望」と認識…', 500],
      ['contact', '住所・築年数・氏名を記録…', 600],
      ['when', '希望:「来週 平日午前」を確保…', 500],
      ['notify', '緊急度=通常。社長へメモを送信…', 500],
    ], showDnResult));
  });
  function showDnResult() {
    $('#dnOut').innerHTML = `
      <div class="gen"><div class="gt">📝 聞き取りメモ<span class="pill">自動作成</span></div>
        <div class="kv"><span class="k">お名前</span><span>田中 様</span></div>
        <div class="kv"><span class="k">用件</span><span>外壁塗装の見積り希望</span></div>
        <div class="kv"><span class="k">物件</span><span>◯◯市△△町・戸建て・築15年</span></div>
        <div class="kv"><span class="k">希望日時</span><span>来週 平日の午前</span></div>
        <div class="kv"><span class="k">緊急度</span><span style="color:var(--ok);">通常（折返しでOK）</span></div>
      </div>
      <div class="gen" style="border-color:var(--cyan-dim);"><div class="gt">🔔 社長への通知</div><p style="color:var(--text);">「見積り依頼1件。田中様（◯◯市・築15年・外壁）。来週平日午前ご希望。折返しリストに追加しました。」</p></div>`;
    $('#dnCta').innerHTML = demoCta('“出られなかった”で失注しない', '営業に困っていなくても、取りこぼしは純粋な損。保険として効きます。', 'もう一度、実演を見る');
    show('dn1', 'dn2');
    wireDemoCta(root, () => renderDenwa(root));
  }
}

/* =========================================================
   ステージ遷移 / ルーター
   ========================================================= */
function show(fromId, toId) {
  const f = document.getElementById(fromId); if (f) f.classList.add('hidden');
  const t = document.getElementById(toId); if (t) { t.classList.remove('hidden'); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function setBar({ back, title }) {
  const bar = $('#appbar');
  bar.classList.toggle('hasback', !!back);
  $('#barTitle').textContent = title || '';
  $('#barTitle').classList.toggle('hidden', !title);
  $('#barBrand').classList.toggle('hidden', !!title);
}

function router() {
  clearTimers();
  const root = $('#view');
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/emp\/(\w+)/);
  if (m && EMP[m[1]]) {
    const e = EMP[m[1]];
    (e.kind === 'demo' ? e.render(root) : renderConcept(root, m[1]));
  } else {
    renderHome(root);
  }
}
window.addEventListener('hashchange', router);

/* ---------- install (Android/Chrome) ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  if (!sessionStorage.getItem('installDismiss')) $('#installbar').classList.add('show');
});
function initInstall() {
  $('#installBtn').addEventListener('click', async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#installbar').classList.remove('show'); }
    else { showIosSheet(); }
  });
  $('#installX').addEventListener('click', () => { $('#installbar').classList.remove('show'); sessionStorage.setItem('installDismiss', '1'); });
  $('#iosClose').addEventListener('click', () => $('#iosSheet').classList.remove('show'));
  // iOS: no beforeinstallprompt. Show a hint bar if not standalone.
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIos && !standalone && !sessionStorage.getItem('installDismiss')) $('#installbar').classList.add('show');
}
function showIosSheet() { $('#iosSheet').classList.add('show'); }

/* ---------- boot ---------- */
function boot() { initInstall(); router(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
