window.FunkinProject = {
  name: "Funkin' Coding",
  version: '1.0.0',
  engine: 'multi',
  entry: 'source/Main.js',
  modules: ['login.js', 'community.js', 'source/Main.js'],
  loaded: []
};

(function loadMain(){
  const script = document.createElement('script');
  script.src = './source/Main.js';
  script.defer = true;
  script.onload = function(){
    window.FunkinProject.loaded.push('source/Main.js');
    if(window.FunkinMain && typeof window.FunkinMain.boot === 'function'){
      window.FunkinMain.boot(window.FunkinProject);
    }
  };
  script.onerror = function(){
    console.error('[project.js] Failed to load source/Main.js');
  };
  document.head.appendChild(script);
})();
