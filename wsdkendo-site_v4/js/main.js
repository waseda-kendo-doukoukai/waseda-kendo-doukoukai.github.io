// 全ページ共通のスクリプト
// 年度は4月始まりで計算する（例：2027年3月は2026年度）
(function () {
  var now = new Date();
  var fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;

  // 創立○年目：<span data-founded="1962"></span> の中身を自動計算（1962年度＝1年目）
  document.querySelectorAll('[data-founded]').forEach(function (el) {
    var founded = parseInt(el.getAttribute('data-founded'), 10);
    el.textContent = fiscalYear - founded + 1;
  });

  // フッターの著作権表示の年
  document.querySelectorAll('[data-current-year]').forEach(function (el) {
    el.textContent = now.getFullYear();
  });
})();
