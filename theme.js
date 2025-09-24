(function(){
  const KEY = 'ui_theme';
  function applyTheme(){
    const theme = localStorage.getItem(KEY) || 'theme-peach-teal';
    document.body.classList.remove('theme-peach-teal','theme-blue-pink','theme-mono');
    document.body.classList.add(theme);
    const sel = document.getElementById('styleSelect');
    if(sel) sel.value = theme;
  }
  document.addEventListener('DOMContentLoaded', function(){
    applyTheme();
    const sel = document.getElementById('styleSelect');
    if(!sel) return;
    sel.addEventListener('change', function(){
      localStorage.setItem(KEY, sel.value);
      applyTheme();
    });
  });
})();