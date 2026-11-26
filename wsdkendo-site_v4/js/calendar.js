// カレンダーの表示処理（予定の中身は calendar-data.js に書く。このファイルは通常さわらない）
(function () {
  if (typeof CALENDAR === "undefined") return;

  var WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  var LABEL = { practice: "稽古", match: "試合", event: "行事", extra: "稽古（変更）", open: "個人開放", cancel: "休み" };
  var OPEN_FEE = "使用料400円";
  function replaces(t) { return t === "extra" || t === "open"; }
  function isPractice(t) { return t === "practice" || replaces(t); }

  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function key(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function md(d) { return (d.getMonth() + 1) + "/" + d.getDate() + "（" + WEEK[d.getDay()] + "）"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // 日付 → その日の予定一覧
  var cancelMap = {}, eventMap = {};
  (CALENDAR.cancel || []).forEach(function (c) { cancelMap[c.date] = c; });
  (CALENDAR.events || []).forEach(function (e) {
    var d = parse(e.date), end = parse(e.end || e.date), n = 0;
    while (d <= end && n++ < 60) { (eventMap[key(d)] = eventMap[key(d)] || []).push(e); d.setDate(d.getDate() + 1); }
  });

  function itemsOf(d) {
    var k = key(d), list = [], p = CALENDAR.practice || {};
    var hasExtra = (eventMap[k] || []).some(function (e) { return replaces(e.type); });
    if (cancelMap[k]) list.push({ type: "cancel", title: "稽古休み", note: cancelMap[k].note || "" });
    else if ((p.days || []).indexOf(d.getDay()) !== -1 && !hasExtra) list.push({ type: "practice", title: "稽古", time: p.time || "" });
    (eventMap[k] || []).forEach(function (e) {
      var t = e.type || "event";
      list.push({ type: t, title: e.title || LABEL[t] || "", time: e.time || (replaces(t) ? p.time || "" : ""),
        note: e.note || (t === "open" ? OPEN_FEE : ""), src: e });
    });
    return list;
  }

  function line(it) {
    var title = (it.title === LABEL[it.type] || it.type === "practice" || it.type === "cancel") ? "" : it.title;
    return '<span class="cal-tag t-' + esc(it.type) + '">' + LABEL[it.type] + "</span>" + esc(title) +
      (it.time ? '<span class="cal-time">' + esc(it.time) + "</span>" : "") +
      (it.note ? '<span class="cal-note">' + esc(it.note) + "</span>" : "");
  }

  var today = new Date(); today.setHours(0, 0, 0, 0);

  // 一覧に載せるか（何日も続く予定は、表示範囲の最初の日に1回だけ載せる）と、その日付の表記
  function listed(it, d, floor) {
    if (!it.src || !it.src.end) return true;
    var start = parse(it.src.date);
    return key(d) === key(start < floor ? floor : start);
  }
  function dateLabel(it, d) {
    if (it.src && it.src.end) return md(parse(it.src.date)) + "〜" + md(parse(it.src.end));
    return md(d);
  }

  // ---------- 月表示カレンダー（練習日・場所ページ） ----------
  var box = document.getElementById("calendar");
  if (box) {
    var cur = new Date(today.getFullYear(), today.getMonth(), 1);
    var draw = function () {
      var y = cur.getFullYear(), m = cur.getMonth();
      var first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
      var h = '<div class="cal-head"><button type="button" data-move="-1" aria-label="前の月">‹ 前月</button>' +
        "<strong>" + y + "年" + (m + 1) + "月</strong>" +
        '<button type="button" data-move="1" aria-label="次の月">次月 ›</button></div>' +
        '<div class="cal-grid" role="table"><div class="cal-row" role="row">';
      WEEK.forEach(function (w, i) { h += '<div class="cal-dow d' + i + '" role="columnheader">' + w + "</div>"; });
      h += "</div>";
      var cells = [], i;
      for (i = 0; i < first.getDay(); i++) cells.push('<div class="cal-cell empty" role="cell"></div>');
      var monthList = [];
      for (i = 1; i <= days; i++) {
        var d = new Date(y, m, i), its = itemsOf(d);
        var cls = "cal-cell d" + d.getDay() + (d.getTime() === today.getTime() ? " today" : "");
        var c = '<div class="' + cls + '" role="cell"><span class="cal-date">' + i + "</span>";
        its.forEach(function (it) {
          var txt = isPractice(it.type) ? (it.type === "practice" ? "稽古" : it.title) + (it.time ? " " + it.time : "") : it.title;
          c += '<span class="cal-mark t-' + esc(it.type) + '" title="' + esc(txt + (it.note ? "（" + it.note + "）" : "")) + '">' + esc(txt) + "</span>";
          if (it.type !== "practice" && listed(it, d, first)) monthList.push("<li><time>" + dateLabel(it, d) + "</time><span>" + line(it) + "</span></li>");
        });
        cells.push(c + "</div>");
      }
      while (cells.length % 7) cells.push('<div class="cal-cell empty" role="cell"></div>');
      for (i = 0; i < cells.length; i += 7) h += '<div class="cal-row" role="row">' + cells.slice(i, i + 7).join("") + "</div>";
      h += "</div>";
      h += '<div class="cal-legend"><span class="cal-tag t-practice">稽古</span><span class="cal-tag t-match">試合</span>' +
        '<span class="cal-tag t-event">行事</span><span class="cal-tag t-extra">稽古（変更）</span><span class="cal-tag t-open">個人開放</span><span class="cal-tag t-cancel">休み</span></div>';
      h += "<h3>" + (m + 1) + "月の通常稽古以外の予定</h3>" +
        (monthList.length ? '<ul class="list cal-list">' + monthList.join("") + "</ul>" : '<p class="note">通常稽古以外の予定はありません。</p>');
      box.innerHTML = h;
    };
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-move]");
      if (b) { cur.setMonth(cur.getMonth() + (+b.getAttribute("data-move"))); draw(); }
    });
    draw();
  }

  // ---------- 今後の予定（トップページ） ----------
  var up = document.getElementById("upcoming");
  if (up) {
    var out = [], nexts = [], d = new Date(today);
    for (var n = 0; n < 120 && (out.length < 5 || nexts.length < 2); n++) {
      itemsOf(d).forEach(function (it) {
        var inNext = false;
        if (isPractice(it.type) && nexts.length < 2) { nexts.push({ d: new Date(d), it: it }); inNext = true; }
        if (it.type !== "practice" && !inNext && out.length < 5 && listed(it, d, today)) out.push("<li><time>" + dateLabel(it, d) + "</time><span>" + line(it) + "</span></li>");
      });
      d.setDate(d.getDate() + 1);
    }
    var h = "";
    if (nexts.length) {
      h += '<div class="cal-next">';
      nexts.forEach(function (x, i) {
        h += "<p>" + (i === 0 ? "次の稽古" : "その次") + "：<strong>" + md(x.d) + "</strong>　" + esc(x.it.time || "") +
          (x.it.type !== "practice" ? '<span class="cal-tag t-' + esc(x.it.type) + '" style="margin-left:8px">' + esc(x.it.title) + "</span>" : "") +
          (x.it.note ? '<span class="cal-note">' + esc(x.it.note) + "</span>" : "") + "</p>";
      });
      h += "</div>";
    }
    h += out.length ? '<ul class="list">' + out.join("") + "</ul>" : '<p class="note">直近の試合・行事の予定はありません。</p>';
    up.innerHTML = h;
  }
})();
