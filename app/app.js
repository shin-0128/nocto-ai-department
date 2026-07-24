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
    kind: 'concept',
    concept: {
      before: '見積・請求はExcelを毎回コピペ → 金額ミス・出し忘れ・インボイス番号の記載漏れ',
      after: '客名と工事内容を伝えるだけで、見積書・請求書を自動作成。インボイス番号・振込先・消費税も自動で正しく',
      sample: ['例:「田中様 外壁塗装 一式 68万」→ 項目分解（洗浄/下地/塗装/諸経費）した見積書と、支払期日入りの請求書をセットで生成。', '経理のジローと連携し、発行した請求書はそのまま入金消込まで追える。'],
      note: '※経理のジローと同じ書類エンジン。まず経理から入れると請求も自然につながる。'
    }
  },
  genba: {
    emoji: '📸', name: '現場のケン', role: 'AI社員・写真整理担当',
    one: '現場写真をぐちゃっと渡すだけ。工程別に整理し、お客様向けBefore/After報告書に。',
    kind: 'concept',
    concept: {
      before: '夜、事務所で写真をフォルダ分け → 報告書に貼り付け（1現場30〜40分）',
      after: '写真を投入 → 工程別に自動整理 → お客様提出用のBefore/After報告書が完成。人は確認だけ',
      sample: ['既存の実演デモ（工事写真の自動仕分け）と同じ仕組みを、外壁塗装の工程（高圧洗浄/下地/下塗り/中塗り/上塗り/完了）に合わせて動かします。'],
      note: '※この社員は既存デモ diagnose/ai-shain-jitsuen.html がベース。アプリ版への統合は次段。'
    }
  },
  saiyo: {
    emoji: '🧑‍💼', name: '採用のハナ', role: 'AI社員・採用担当',
    one: '職種と推しを選ぶだけで求人原稿を3媒体ぶん生成。応募が来たら一次返信と面接候補日も下書き。',
    kind: 'demo', render: renderSaiyo
  },
  ikusei: {
    emoji: '🎓', name: '育成のトモ', role: 'AI社員・教育担当',
    one: '新人が現場で見る手順動画・チェックリストを自動で。「見て覚えろ」を仕組みに変える。',
    kind: 'concept',
    concept: {
      before: 'ベテランが付きっきりで教える → 教え方も人によってバラバラ、離職の一因',
      after: '作業手順を話すだけで、テロップ入り手順動画とチェックリストに。新人はスマホで予習・復習',
      sample: ['例:「高圧洗浄の手順」を口頭で入れる → ①養生の確認 ②水圧の設定 ③ケレンの当て方…と手順書＋撮影カット指示に。', '広報のトオルと同じ台本エンジンを教育用途に振り分け。'],
      note: '※採用のハナ／広報のトオルと連携。まず求人と説明動画から着手が効率的。'
    }
  },
  koho: {
    emoji: '🎬', name: '広報のトオル', role: 'AI社員・動画/発信担当',
    one: '会社の説明動画、台本も絵コンテも自動。撮るだけの状態に落とし込む。外注費を圧縮。',
    kind: 'demo', render: renderKoho
  },
  kuchikomi: {
    emoji: '⭐', name: '評判のミオ', role: 'AI社員・口コミ対応担当',
    one: 'Googleの口コミに、その会社らしい丁寧な返信を下書き。星が付く運用を続ける。',
    kind: 'concept',
    concept: {
      before: '口コミが来ても返信が後回し／定型文でそっけない → 評価が伸びない',
      after: '口コミの内容を読んで、感謝と具体に触れた返信を下書き。社長は確認して投稿するだけ',
      sample: ['例:「丁寧に塗ってもらえた」→ 担当職人の名前・工程に触れた返信案を数パターン。低評価には冷静な一次対応案も。'],
      note: '※MEO（地図検索）対策として営業困りごとが無くても評判維持に効く。'
    }
  },
  hojokin: {
    emoji: '🏛️', name: '見張り番のゲン', role: 'AI社員・補助金担当',
    one: '外壁・断熱・省エネ改修の補助金を常時ウォッチ。使える案件を逃さず、お客様への提案材料にも。',
    kind: 'concept',
    concept: {
      before: '補助金は種類も期限もバラバラ → 気づいた時には締切、という取りこぼし',
      after: '国・自治体の外装/断熱系の補助金を監視し、新着・締切間近を通知。お客様提案の後押し材料に',
      sample: ['例: 住宅省エネ2025系、自治体の外壁・屋根塗装助成、断熱改修補助 等を対象地域で監視。', '※制度は毎年変わるため、実際の要件は必ず一次情報（公募要領）で確認する前提。断定はしない。'],
      note: '※補助金は「申請代行」ではなく「情報の見張り＋提案材料化」から。要件確認は専門家と。'
    }
  },
  denwa: {
    emoji: '📞', name: '電話番のリン', role: 'AI社員・一次対応担当',
    one: '取り込み中でも電話を取りこぼさない。用件を聞いて、折返し予約とメモを残す。',
    kind: 'concept',
    concept: {
      before: '現場に出ていて電話に出られない → 機会損失、留守電は折返し漏れ',
      after: '一次対応で用件・連絡先・希望時間を聞き取り、社長のスマホに要約メモ＋折返しリスト',
      sample: ['例:「外壁の見積もりが欲しい」→ 住所・築年数・希望時期をヒアリングしてメモ化。緊急は即転送。'],
      note: '※営業は困っていないとのことなので優先度は低め。取りこぼし防止の保険として。'
    }
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
