(function(){
  function applyStored(){
    const s = localStorage.getItem('ui_theme') || 'ios-light';
    document.body.classList.remove('ios-light','ios-dark','mono');
    document.body.classList.add(s);
    const sel = document.getElementById('styleSelect');
    if (sel) sel.value = s;
  }
  document.addEventListener('DOMContentLoaded', function(){
    applyStored();
    const sel = document.getElementById('styleSelect');
    if(!sel) return;
    sel.addEventListener('change', function(){
      const v = sel.value;
      localStorage.setItem('ui_theme', v);
      applyStored();
    });
  });
})();