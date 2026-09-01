(function () {
  "use strict";

  /* ==================================================================
   * FluxSECS 下載分流
   *
   * SDK        : .NET Standard 2.0，跨平台共用同一份檔案，不分流。
   * Simalutor  : 依「作業系統 + CPU 架構」分流，共 6 個 RID。
   *              macOS 尚未提供版本。
   *
   * GitHub release 需上傳的檔名（與下方 file 欄位一致）：
   *   FluxSECS_Simalutor_win-x64.7z
   *   FluxSECS_Simalutor_win-x86.7z
   *   FluxSECS_Simalutor_win-arm64.7z
   *   FluxSECS_Simalutor_linux-x64.7z
   *   FluxSECS_Simalutor_linux-arm64.7z
   *   FluxSECS_Simalutor_linux-arm.7z
   * ================================================================== */

  var SDK_URL = "./FluxSECS.7z";

  var RELEASE_BASE =
    "https://github.com/yoyo513/yoyo513.github.io/releases/download/Simlutor/";

  var BUILDS = [
    { id: "win-x64",     os: "windows", arch: "x64",   label: "Windows x64" },
    { id: "win-x86",     os: "windows", arch: "x86",   label: "Windows x86（32 位元）" },
    { id: "win-arm64",   os: "windows", arch: "arm64", label: "Windows ARM64" },
    { id: "linux-x64",   os: "linux",   arch: "x64",   label: "Linux x64" },
    { id: "linux-arm64", os: "linux",   arch: "arm64", label: "Linux ARM64" },
    { id: "linux-arm",   os: "linux",   arch: "arm",   label: "Linux ARM（32 位元）" }
  ];

  // 架構無法辨識時，各 OS 的預設版本
  var DEFAULT_ARCH = { windows: "x64", linux: "x64" };

  var OS_LABEL = {
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
    android: "Android",
    unknown: "未知系統"
  };

  function buildUrl(build) {
    return RELEASE_BASE + "FluxSECS_Simalutor_" + build.id + ".7z";
  }

  function findBuild(os, arch) {
    for (var i = 0; i < BUILDS.length; i++) {
      if (BUILDS[i].os === os && BUILDS[i].arch === arch) return BUILDS[i];
    }
    return null;
  }

  function findBuildById(id) {
    for (var i = 0; i < BUILDS.length; i++) {
      if (BUILDS[i].id === id) return BUILDS[i];
    }
    return null;
  }

  /* ------------------------------------------------------------------
   * OS / 架構偵測
   * ------------------------------------------------------------------ */

  function haystack() {
    var uaData = navigator.userAgentData;
    var platform = (uaData && uaData.platform) || navigator.platform || "";
    return (platform + " " + (navigator.userAgent || "")).toLowerCase();
  }

  function detectOS() {
    var hay = haystack();
    if (/windows|win32|win64|wow64/.test(hay)) return "windows";
    // iPadOS 13+ 會回報 MacIntel，一併視為 macOS
    if (/mac|iphone|ipad|ipod/.test(hay)) return "macos";
    // Android 的 UA 也含 "linux"，必須排在 linux 之前
    if (/android/.test(hay)) return "android";
    if (/linux|x11|cros/.test(hay)) return "linux";
    return "unknown";
  }

  // 由 UA 字串猜架構（Firefox / Safari 沒有 userAgentData 時使用）
  function detectArchFromUA() {
    var hay = haystack();
    if (/aarch64|arm64/.test(hay)) return "arm64";
    if (/armv7|armv8l|armhf|\barm\b/.test(hay)) return "arm";
    if (/wow64|win64|x86_64|amd64|x64/.test(hay)) return "x64";
    if (/i686|i386|win32|x86/.test(hay)) return "x86";
    return null;
  }

  // Chromium 系可取得精確架構（非同步）
  function detectArch() {
    var uaData = navigator.userAgentData;
    if (!uaData || typeof uaData.getHighEntropyValues !== "function") {
      return Promise.resolve(detectArchFromUA());
    }
    return uaData
      .getHighEntropyValues(["architecture", "bitness"])
      .then(function (info) {
        var arch = (info.architecture || "").toLowerCase();
        var bits = String(info.bitness || "");
        if (arch === "arm") return bits === "64" ? "arm64" : "arm";
        if (arch === "x86") return bits === "64" ? "x64" : "x86";
        if (arch === "arm64") return "arm64";
        return detectArchFromUA();
      })
      .catch(function () {
        return detectArchFromUA();
      });
  }

  function resolveBuild(os, arch) {
    if (os !== "windows" && os !== "linux") return null;
    return findBuild(os, arch) || findBuild(os, DEFAULT_ARCH[os]);
  }

  /* ------------------------------------------------------------------
   * 下載動作
   * ------------------------------------------------------------------ */

  function triggerHiddenDownload(url) {
    var a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadSDK() {
    triggerHiddenDownload(SDK_URL);
  }

  function downloadSimalutor() {
    return detectArch().then(function (arch) {
      var build = resolveBuild(detectOS(), arch);
      if (!build) return false;
      triggerHiddenDownload(buildUrl(build));
      return true;
    });
  }

  /* ------------------------------------------------------------------
   * UI
   * ------------------------------------------------------------------ */

  var state = { build: null };

  function setDisabled(btn, disabled) {
    if (!btn) return;
    btn.classList.toggle("is-disabled", !!disabled);
    if (disabled) {
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("tabindex", "-1");
    } else {
      btn.removeAttribute("aria-disabled");
      btn.removeAttribute("tabindex");
    }
  }

  function renderAltList(listEl, currentId) {
    if (!listEl) return;
    listEl.innerHTML = "";
    BUILDS.forEach(function (build) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = buildUrl(build);
      a.setAttribute("download", "");
      a.textContent = build.label;
      if (build.id === currentId) a.classList.add("is-current");
      li.appendChild(a);
      listEl.appendChild(li);
    });
  }

  function initSimulatorCard() {
    var btn = document.getElementById("simulatorDownloadBtn");
    var note = document.getElementById("simulatorOsNote");
    var altWrap = document.getElementById("simulatorAltWrap");
    var altList = document.getElementById("simulatorAltList");
    if (!btn) return;

    var os = detectOS();

    // macOS / 其他系統：直接停用，不必等架構偵測
    if (os !== "windows" && os !== "linux") {
      setDisabled(btn, true);
      if (os === "macos") {
        btn.textContent = "macOS 尚未支援";
        if (note) note.textContent = "偵測到 macOS，Simalutor 尚未提供 macOS 版本。";
      } else {
        btn.textContent = "此系統尚未支援";
        if (note) {
          note.textContent =
            "無法辨識你的系統（" + (OS_LABEL[os] || OS_LABEL.unknown) +
            "），Simalutor 僅提供 Windows 與 Linux 版本。";
        }
      }
      if (altWrap) altWrap.hidden = false;
      renderAltList(altList, null);
      return;
    }

    detectArch().then(function (arch) {
      var build = resolveBuild(os, arch);
      state.build = build;

      if (!build) {
        setDisabled(btn, true);
        btn.textContent = "此系統尚未支援";
        if (note) note.textContent = "找不到對應版本，請從下方清單自行選擇。";
      } else {
        setDisabled(btn, false);
        btn.textContent = "下載 Simalutor（" + build.label + "）";
        if (note) {
          note.textContent = arch
            ? "偵測到 " + build.label + "，將下載對應版本。"
            : "無法確認 CPU 架構，預設提供 " + build.label + "。";
        }
      }

      if (altWrap) altWrap.hidden = false;
      renderAltList(altList, build ? build.id : null);
    });
  }

  function initAltToggle() {
    var toggle = document.getElementById("simulatorAltToggle");
    var list = document.getElementById("simulatorAltList");
    if (!toggle || !list) return;
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      list.hidden = open;
    });
  }

  function init() {
    initAltToggle();
    initSimulatorCard();

    document.addEventListener("click", function (event) {
      var target = event.target.closest ? event.target.closest("[data-download]") : null;
      if (!target) return;
      event.preventDefault();
      if (target.getAttribute("aria-disabled") === "true") return;

      var kind = target.getAttribute("data-download");
      if (kind === "sdk") downloadSDK();
      else if (kind === "simulator") downloadSimalutor();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // 對外 API
  window.detectOS = detectOS;
  window.detectArch = detectArch;
  window.downloadSDK = downloadSDK;
  window.downloadSimalutor = downloadSimalutor;
  window.downloadSimalutorBuild = function (id) {
    var build = findBuildById(id);
    if (!build) return false;
    triggerHiddenDownload(buildUrl(build));
    return true;
  };
})();
