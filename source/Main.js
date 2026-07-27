window.FunkinMain = (function(){
  let booted = false;
  let readyFired = false;

  function log(message){
    console.log('[Main] ' + message);
  }

  function boot(project){
    if(booted) return;
    booted = true;

    log((project && project.name ? project.name : "Funkin' Coding") + ' v' + (project ? project.version : '?') + ' — system online');

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', onDomReady);
    } else {
      onDomReady();
    }
  }

  function onDomReady(){
    log('DOM ready — checking modules...');
    checkModule('FunkinAuth', 'login.js', 20);
    checkModule('FC_UI_LANG', 'index.html (i18n)', 20, true);
  }

  function checkModule(globalName, label, attemptsLeft, isValue){
    const present = isValue ? (typeof window[globalName] !== 'undefined') : !!window[globalName];
    if(present){
      log(label + ' detected.');
      afterAllChecked();
    } else if(attemptsLeft > 0){
      setTimeout(function(){ checkModule(globalName, label, attemptsLeft - 1, isValue); }, 250);
    } else {
      log(label + ' not detected after waiting — continuing without it.');
      afterAllChecked();
    }
  }

  let checksRemaining = 2;
  function afterAllChecked(){
    checksRemaining--;
    if(checksRemaining <= 0 && !readyFired){
      readyFired = true;
      log('Boot sequence complete.');
      window.dispatchEvent(new CustomEvent('fc-main-ready', { detail: window.FunkinProject }));
    }
  }

  function getProject(){
    return window.FunkinProject || null;
  }

  return {
    boot: boot,
    getProject: getProject
  };
})();
