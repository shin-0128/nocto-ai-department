'use strict';
/* =========================================================
   標準単価マスタ（外装リフォーム）— v0
   出所: 一般的な相場レンジの中央値(仮)。実運用では ①この会社の過去見積で上書き学習
   ②Shン/相場データで調整。金額は全て税抜。
   ハイブリッド: ここが「標準」。取込学習した単価があればそちらを優先する(engine側)。
   ========================================================= */
const TANKA = {
  version: '2026-07 標準(仮)',
  // 外壁塗装（㎡単価・グレード別・3回塗り前提）
  wall: {
    'シリコン': { name: '外壁塗装 シリコン 3回塗り', price: 2300 },
    'ラジカル': { name: '外壁塗装 ラジカル制御 3回塗り', price: 2600 },
    'フッ素':   { name: '外壁塗装 フッ素 3回塗り', price: 3400 },
    '無機':     { name: '外壁塗装 無機 3回塗り', price: 4200 },
  },
  // 屋根塗装（㎡単価・グレード別）
  roof: {
    'シリコン': { name: '屋根塗装 シリコン 3回塗り', price: 2000 },
    '遮熱':     { name: '屋根塗装 遮熱シリコン 3回塗り', price: 2800 },
    'フッ素':   { name: '屋根塗装 フッ素 3回塗り', price: 3200 },
  },
  // 共通項目
  fixed: {
    scaffold: { key: 'scaffold', name: '仮設足場・飛散防止ネット', unit: '㎡', price: 800 },
    wash:     { key: 'wash', name: '高圧洗浄', unit: '㎡', price: 250 },
    yojo:     { key: 'yojo', name: '養生', unit: '式', price: 25000 },
    shitaji:  { key: 'shitaji', name: '下地補修（シール打替・ひび割れ）', unit: '式', price: 40000 },
    futai:    { key: 'futai', name: '付帯部塗装（軒天・雨樋・破風板）', unit: '式', price: 45000 },
    shokei:   { key: 'shokei', name: '諸経費（運搬・廃材処分等）', unit: '式', price: 30000 },
  },
};

/* 商談用の単価パターン3種（実数を出したくない客が「近いやつ」を選べる）
   keys: scaffold/wash/wall/roof/yojo/shitaji/futai/shokei（wall/roofは㎡単価） */
const TANKA_PRESETS = [
  { id: 1, label: '①  相場より安め', desc: '数量・スピード勝負の会社',
    tanka: { scaffold: 700, wash: 220, wall: 2000, roof: 1800, yojo: 20000, shitaji: 30000, futai: 38000, shokei: 25000 } },
  { id: 2, label: '②  標準的', desc: '一般的な地域相場',
    tanka: { scaffold: 850, wash: 280, wall: 2400, roof: 2200, yojo: 28000, shitaji: 45000, futai: 48000, shokei: 35000 } },
  { id: 3, label: '③  高品質・高単価', desc: '高耐候塗料・丁寧施工が売り',
    tanka: { scaffold: 950, wash: 320, wall: 3000, roof: 2800, yojo: 35000, shitaji: 60000, futai: 55000, shokei: 45000 } },
];
