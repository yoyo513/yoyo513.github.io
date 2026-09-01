(function () {
  "use strict";

  /* ==================================================================
   * 首頁通訊流程動畫
   *
   * 依真實的 HSMS / SECS-II / GEM 流程演示：
   *   連線建立（只顯示狀態）→ 建立通訊 → 命令 → 事件回報 → 警報
   *
   * HSMS 傳輸層的 Select / Linktest 不畫封包，避免畫面被底層交握佔滿。
   * 要增減訊息或改順序，只要改下面的 SEQUENCE 陣列。
   * （封包支援 kind: "data" | "ctrl" | "alarm" 三種配色，ctrl 目前未使用。）
   * ================================================================== */

  var SEQUENCE = [
    // HSMS 傳輸層（TCP 連線、Select、Linktest）不畫封包，
    // 只用核心的狀態徽章帶過，畫面留給 SECS-II 訊息。
    { type: "state", state: "NOT CONNECTED", tone: "idle", log: "等待連線", hold: 900 },
    { type: "state", state: "CONNECTING",    tone: "warn", log: "HSMS 連線中", hold: 900 },
    { type: "state", state: "SELECTED",      tone: "ok",   log: "連線建立", hold: 800 },

    { type: "msg", label: "S1F13", dir: "h2e", log: "S1F13 Establish Communications Request — 請求建立通訊" },
    { type: "msg", label: "S1F14", dir: "e2h", log: "S1F14 Establish Communications Acknowledge — 通訊建立完成", state: "COMMUNICATING", tone: "ok" },

    { type: "msg", label: "S1F1", dir: "h2e", log: "S1F1 Are You There — 確認對方在線" },
    { type: "msg", label: "S1F2", dir: "e2h", log: "S1F2 On Line Data — 回覆 MDLN / SOFTREV" },

    { type: "msg", label: "S2F41", dir: "h2e", log: "S2F41 Host Command Send — Host 下遠端命令" },
    { type: "msg", label: "S2F42", dir: "e2h", log: "S2F42 Host Command Acknowledge — 設備回覆執行結果" },

    { type: "msg", label: "S6F11", dir: "e2h", log: "S6F11 Event Report Send — 設備主動回報事件" },
    { type: "msg", label: "S6F12", dir: "h2e", log: "S6F12 Event Report Acknowledge — Host 確認收到" },

    // 警報用封包顏色和節點閃紅表示，不動狀態徽章：
    // 設備發警報時 HSMS 通訊狀態仍是 COMMUNICATING。
    { type: "msg", label: "S5F1", dir: "e2h", kind: "alarm", log: "S5F1 Alarm Report Send — 設備發出警報" },
    { type: "msg", label: "S5F2", dir: "h2e", log: "S5F2 Alarm Report Acknowledge — Host 確認警報" }
  ];

  var LEG = 620;   // 封包走完一段線的時間
  var HOP = 200;   // 通過 FluxSECS 核心的停留
  var GAP = 380;   // 兩則訊息之間的間隔

  var root = document.getElementById("secsDemo");
  if (!root) return;

  var nodes = {
    host: root.querySelector('[data-node="host"]'),
    core: root.querySelector('[data-node="core"]'),
    equip: root.querySelector('[data-node="equip"]')
  };
  var wires = {
    left: root.querySelector('[data-wire="left"]'),
    right: root.querySelector('[data-wire="right"]')
  };
  var packets = {
    left: root.querySelector('[data-packet="left"]'),
    right: root.querySelector('[data-packet="right"]')
  };
  var stateEl = root.querySelector(".secs-state");
  var logEl = root.querySelector(".secs-log-text");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var stacked = window.matchMedia("(max-width: 760px)");

  var running = false;
  var stopped = false;
  var index = 0;

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function setState(text, tone) {
    if (!stateEl || !text) return;
    stateEl.textContent = text;
    stateEl.setAttribute("data-tone", tone || "ok");
  }

  function setLog(text) {
    if (!logEl) return;
    logEl.textContent = text;
  }

  function flash(el, ms, extra) {
    if (!el) return Promise.resolve();
    el.classList.add("is-active");
    if (extra) el.classList.add(extra);
    return wait(ms).then(function () {
      el.classList.remove("is-active");
      if (extra) el.classList.remove(extra);
    });
  }

  // 封包沿著一段線移動；stacked 版面改成垂直移動
  function travel(wireKey, step, backwards) {
    var wire = wires[wireKey];
    var packet = packets[wireKey];
    if (!wire || !packet) return Promise.resolve();

    packet.textContent = step.label;
    packet.setAttribute("data-kind", step.kind || "data");
    packet.classList.add("is-live");

    if (reduceMotion.matches) {
      // 尊重系統的減少動態設定：不移動，只在中間淡入淡出
      packet.style.transform = "";
      packet.classList.add("is-static");
      return wait(420).then(function () {
        packet.classList.remove("is-live", "is-static");
      });
    }

    packet.classList.remove("is-static");

    var vertical = stacked.matches;
    var span = vertical
      ? wire.clientHeight - packet.offsetHeight
      : wire.clientWidth - packet.offsetWidth;
    if (span < 0) span = 0;

    var from = backwards ? span : 0;
    var to = backwards ? 0 : span;
    // 直向版面的封包是用 left:50% + translateX(-50%) 置中，
    // 移動時必須把置中的位移一起帶上，否則會跑到線的右邊。
    var at = function (t) {
      var d = from + (to - from) * t;
      return vertical
        ? "translate(-50%, " + d + "px)"
        : "translateX(" + d + "px)";
    };

    var anim = packet.animate(
      [
        { transform: at(0), opacity: 0 },
        { transform: at(0.14), opacity: 1, offset: 0.14 },
        { transform: at(0.86), opacity: 1, offset: 0.86 },
        { transform: at(1), opacity: 0 }
      ],
      { duration: LEG, easing: "cubic-bezier(.35,0,.25,1)" }
    );

    return anim.finished
      .catch(function () {})
      .then(function () { packet.classList.remove("is-live"); });
  }

  function playMessage(step) {
    var toEquip = step.dir === "h2e";
    var first = toEquip ? "left" : "right";
    var second = toEquip ? "right" : "left";
    var origin = toEquip ? nodes.host : nodes.equip;
    var target = toEquip ? nodes.equip : nodes.host;
    // 警報訊息讓節點閃紅，跟一般訊息區分
    var mood = step.kind === "alarm" ? "is-alarm" : null;

    setLog(step.log);
    root.setAttribute("data-flow", step.dir);

    flash(origin, LEG * 0.5, mood);

    return travel(first, step, !toEquip)
      .then(function () {
        return flash(nodes.core, HOP + 120, mood);
      })
      .then(function () { return wait(HOP); })
      .then(function () { return travel(second, step, !toEquip); })
      .then(function () {
        // 狀態徽章只在流程真的推進到新的 HSMS 狀態時才改，
        // 否則訊息本身的性質（例如警報）會被誤讀成連線狀態。
        if (step.state) setState(step.state, step.tone);
        return flash(target, 420, mood);
      });
  }

  function playStep(step) {
    if (step.type === "state") {
      setState(step.state, step.tone);
      setLog(step.log);
      return wait(step.hold || 800);
    }
    return playMessage(step).then(function () { return wait(GAP); });
  }

  function loop() {
    if (stopped) { running = false; return; }
    running = true;
    var step = SEQUENCE[index];
    index = (index + 1) % SEQUENCE.length;
    playStep(step).then(function () {
      if (stopped) { running = false; return; }
      loop();
    });
  }

  function start() {
    if (running || stopped) return;
    loop();
  }

  function stop() {
    stopped = true;
  }

  function resume() {
    if (!stopped) return;
    stopped = false;
    if (!running) loop();
  }

  // 捲出畫面或切到別的分頁時暫停，不浪費效能
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) resume();
        else stop();
      });
    }, { threshold: 0.15 });
    io.observe(root);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else resume();
  });

  setState("NOT CONNECTED", "idle");
  setLog("等待連線…");
  start();
})();
