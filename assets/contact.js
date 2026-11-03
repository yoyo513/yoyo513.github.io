// 聯絡表單：按送出後用 mailto 打開訪客的郵件程式，內容自動填好
// 收件信箱已編碼（enc: 開頭），原始碼中不會出現明文信箱。
// 要換信箱：把新信箱告訴 Claude 產生編碼，或直接改成明文，例如 var FORM_ID = 'abc@example.com';
var FORM_ID = 'enc:=cHdu02bj5Cdm92chRmbhJHQ5FmU';
var CONTACT_EMAIL = FORM_ID.indexOf('enc:') === 0
  ? atob(FORM_ID.slice(4).split('').reverse().join(''))
  : FORM_ID;


(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;
  var status = document.getElementById('contactStatus');

  function show(msg, type) {
    status.textContent = msg;
    status.className = 'contact-status' + (type ? ' is-' + type : '');
  }
  function val(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? (el.value || '').trim() : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (val('_honey')) return; // 機器人

    var subject = 'FluxSECS 官網留言：' + val('主旨');
    var lines = [
      '姓名：' + val('姓名'),
      'Email：' + val('email'),
      '公司：' + (val('公司') || '（未填）'),
      '',
      '內容：',
      val('內容')
    ];
    var body = lines.join('\r\n');

    // 用 mailto 打開訪客的郵件程式，收件人、主旨、內容自動填好
    var href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    window.location.href = href;
    show('已開啟您的郵件程式，請在郵件中按「傳送」完成寄出。', 'ok');
  });
})();
