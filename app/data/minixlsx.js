'use strict';
/* =========================================================
   MiniXLSX — 依存ゼロの軽量スプレッドシート読取
   .xlsx（zip+XML）と .csv に対応。SheetJS の置き換え。
   .xlsx は zip を自前で解凍（DecompressionStream）→ sharedStrings と
   worksheet の XML を DOMParser で読む。古い .xls(OLE) は非対応。
   使い方: const {sheets} = await MiniXLSX.read(file);  // sheets[i].rows = 2次元配列
   ========================================================= */
const MiniXLSX = (() => {
  // --- raw deflate 解凍（ブラウザ標準API） ---
  async function inflateRaw(u8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('NO_DECOMPRESSION');
    const ds = new DecompressionStream('deflate-raw');
    const ab = await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(ab);
  }

  // --- ZIP 中央ディレクトリを読み、必要エントリを取り出す ---
  function openZip(ab) {
    const dv = new DataView(ab);
    const u8 = new Uint8Array(ab);
    let eocd = -1;
    for (let i = ab.byteLength - 22; i >= 0; i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('NOT_ZIP');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true);
      const compSize = dv.getUint32(p + 20, true);
      const fnLen = dv.getUint16(p + 28, true);
      const extraLen = dv.getUint16(p + 30, true);
      const commentLen = dv.getUint16(p + 32, true);
      const lho = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + fnLen));
      files[name] = { method, compSize, lho };
      p += 46 + fnLen + extraLen + commentLen;
    }
    return { dv, u8, files };
  }
  async function readEntry(zip, name) {
    const f = zip.files[name]; if (!f) return null;
    const { dv, u8 } = zip;
    const fnLen = dv.getUint16(f.lho + 26, true);
    const extraLen = dv.getUint16(f.lho + 28, true);
    const start = f.lho + 30 + fnLen + extraLen;
    const comp = u8.subarray(start, start + f.compSize);
    let raw;
    if (f.method === 0) raw = comp;
    else if (f.method === 8) raw = await inflateRaw(comp);
    else throw new Error('ZIP_METHOD_' + f.method);
    return new TextDecoder('utf-8').decode(raw);
  }

  // --- XML 解析 ---
  function parseXML(text) { return new DOMParser().parseFromString(text, 'application/xml'); }
  function textOf(el) { // <si> や <is> 内の複数 <t> を連結
    const ts = el.getElementsByTagName('t');
    if (!ts.length) return el.textContent || '';
    let s = ''; for (let i = 0; i < ts.length; i++) s += ts[i].textContent || '';
    return s;
  }
  function parseSharedStrings(xml) {
    const doc = parseXML(xml);
    const si = doc.getElementsByTagName('si');
    const out = [];
    for (let i = 0; i < si.length; i++) out.push(textOf(si[i]));
    return out;
  }
  function colOf(ref) { // "AB12" -> 列index(0起点)
    const m = /^([A-Za-z]+)(\d+)$/.exec(ref || '');
    if (!m) return null;
    let c = 0; const L = m[1].toUpperCase();
    for (let i = 0; i < L.length; i++) c = c * 26 + (L.charCodeAt(i) - 64);
    return c - 1;
  }
  function parseSheet(xml, shared) {
    const doc = parseXML(xml);
    const rowsEl = doc.getElementsByTagName('row');
    const rows = [];
    for (let r = 0; r < rowsEl.length; r++) {
      const cells = rowsEl[r].getElementsByTagName('c');
      const arr = [];
      let auto = 0;
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        let col = colOf(c.getAttribute('r'));
        if (col == null) col = auto;
        auto = col + 1;
        const t = c.getAttribute('t');
        let val = null;
        const v = c.getElementsByTagName('v')[0];
        if (t === 's') { if (v) val = shared[parseInt(v.textContent, 10)] || ''; }
        else if (t === 'inlineStr') { const is = c.getElementsByTagName('is')[0]; val = is ? textOf(is) : ''; }
        else if (t === 'str') { val = v ? v.textContent : ''; }
        else { if (v) { const n = parseFloat(v.textContent); val = isNaN(n) ? v.textContent : n; } }
        arr[col] = val;
      }
      rows.push(arr);
    }
    return rows;
  }

  // --- CSV ---
  function parseCsv(text) {
    return text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length).map((line) => {
      // シンプルなクオート対応
      const out = []; let cur = ''; let q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
        else { if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; }
      }
      out.push(cur);
      return out.map((s) => { const t = s.trim(); const n = parseFloat(t.replace(/,/g, '')); return (t !== '' && !isNaN(n) && /^[-\d.,]+$/.test(t)) ? n : t; });
    });
  }

  async function read(file) {
    const name = (file.name || '').toLowerCase();
    const ab = await file.arrayBuffer();
    const head = new Uint8Array(ab.slice(0, 4));
    if (name.endsWith('.csv')) return { sheets: [{ name: 'CSV', rows: parseCsv(new TextDecoder().decode(ab)) }] };
    if (head[0] === 0xD0 && head[1] === 0xCF) throw new Error('OLD_XLS'); // 古いxls(OLE)
    if (!(head[0] === 0x50 && head[1] === 0x4B)) { // PKでない→CSVとして試す
      return { sheets: [{ name: 'CSV', rows: parseCsv(new TextDecoder().decode(ab)) }] };
    }
    const zip = openZip(ab);
    let shared = [];
    const ss = await readEntry(zip, 'xl/sharedStrings.xml');
    if (ss) shared = parseSharedStrings(ss);
    const sheetNames = Object.keys(zip.files).filter((k) => /^xl\/worksheets\/sheet[^/]*\.xml$/i.test(k)).sort();
    const sheets = [];
    for (const sn of sheetNames) {
      const xml = await readEntry(zip, sn);
      if (xml) sheets.push({ name: sn, rows: parseSheet(xml, shared) });
    }
    return { sheets };
  }

  return { read };
})();
