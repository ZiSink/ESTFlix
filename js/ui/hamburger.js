(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('hamburgerBtn');
    if (!btn) return;
    var nav = btn.closest('.nav');
    if (!nav) return;

    btn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.textContent = isOpen ? '✕' : '☰';
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });
  });
})();
