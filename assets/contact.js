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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var data = new FormData(form);
    if (data.get('_honey')) return; // 機器人
    if (location.protocol === 'file:') {
      show('表單需要在網站上線後才能使用（目前是直接開啟本機檔案）。', 'error');
      return;
    }
    data.append('_subject', 'FluxSECS 官網留言：' + (data.get('主旨') || ''));
    data.append('_template', 'table');
    data.append('_replyto', data.get('email') || '');

    btn.disabled = true;
    show('傳送中…');
    fetch('https://formsubmit.co/ajax/' + encodeURIComponent(CONTACT_EMAIL), {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: data
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && String(res.j.success) === 'true') {
          form.reset();
          show('已送出，謝謝您的留言！我們會盡快回覆。', 'ok');
        } else {
          var msg = (res.j && res.j.message) || '';
          if (/activat/i.test(msg)) {
            // 第一次使用：FormSubmit 已寄確認信到收件信箱
            show('表單尚未啟用，請稍後再試。', 'error');
          } else {
            show('送出失敗：' + (msg || '未知錯誤') + '，請稍後再試。', 'error');
          }
        }
      })
      .catch(function (err) {
        show('送出失敗，請檢查網路連線後再試一次。', 'error');
      })
      .then(function () { btn.disabled = false; });
  });
})();
