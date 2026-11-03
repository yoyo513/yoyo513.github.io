// 聯絡表單：透過 FormSubmit 寄出
// 收件信箱已編碼，原始碼中不會出現明文信箱。
// 啟用表單後，可把 FORM_ID 換成 FormSubmit 確認信中的隨機代碼（直接填代碼，不用編碼）。
var FORM_ID = 'enc:=cHdu02bj5Cdm92chRmbhJHQ5FmU';
var CONTACT_EMAIL = FORM_ID.indexOf('enc:') === 0
  ? atob(FORM_ID.slice(4).split('').reverse().join(''))
  : FORM_ID;


(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var btn = document.getElementById('contactSubmit');
  var status = document.getElementById('contactStatus');

  function show(msg, type) {
    status.textContent = msg;
    status.className = 'contact-status' + (type ? ' is-' + type : '');
  }

  function addHidden(name, value) {
    var el = form.querySelector('input[type=hidden][name="' + name + '"]');
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      form.appendChild(el);
    }
    el.value = value;
  }

  // 寄出後 FormSubmit 會導回本頁並帶 ?sent=1
  if (/[?&]sent=1/.test(location.search)) {
    show('已送出，謝謝您的留言！我們會盡快回覆。', 'ok');
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }

  // 使用者按「上一頁」回來時，把按鈕恢復
  window.addEventListener('pageshow', function () {
    btn.disabled = false;
    if (!/[?&]sent=1/.test(location.search) && status.textContent === '傳送中…') show('');
  });

  form.addEventListener('submit', function (e) {
    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }
    if (form.querySelector('[name=_honey]').value) { e.preventDefault(); return; } // 機器人
    if (location.protocol === 'file:') {
      e.preventDefault();
      show('表單需要在網站上線後才能使用（目前是直接開啟本機檔案）。', 'error');
      return;
    }

    var subject = (form.querySelector('[name="主旨"]').value || '').trim();
    var email = (form.querySelector('[name=email]').value || '').trim();
    addHidden('_subject', 'FluxSECS 官網留言：' + subject);
    addHidden('_template', 'table');
    addHidden('_captcha', 'false');
    addHidden('_replyto', email);
    addHidden('_next', location.origin + location.pathname + '?sent=1');

    // 送出時才設定目的地，原始碼中不會出現信箱
    form.action = 'https://formsubmit.co/' + encodeURIComponent(CONTACT_EMAIL);
    form.method = 'POST';
    btn.disabled = true;
    show('傳送中…');
    // 不攔截，讓瀏覽器以一般表單方式送出
  });
})();
