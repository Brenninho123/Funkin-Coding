const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const AUTH_STORAGE_KEY = 'fc_google_user';

function decodeJwt(token){
  const payload = token.split('.')[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(decoded);
}

function saveUser(user){
  try{
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch(err){}
}

function loadUser(){
  try{
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(err){
    return null;
  }
}

function clearUser(){
  try{
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch(err){}
}

function getCurrentUser(){
  return loadUser();
}

function handleCredentialResponse(response){
  let payload;
  try{
    payload = decodeJwt(response.credential);
  } catch(err){
    return;
  }
  const user = {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
    idToken: response.credential
  };
  saveUser(user);
  renderAuthUI(user);
  window.dispatchEvent(new CustomEvent('fc-auth-changed', {detail: user}));
}

function renderGoogleButton(){
  if(!(window.google && window.google.accounts && window.google.accounts.id)) return;
  const target = document.getElementById('googleSignInBtn');
  if(!target) return;
  target.innerHTML = '';
  google.accounts.id.renderButton(target, {
    theme: 'filled_black',
    size: 'medium',
    shape: 'pill',
    text: 'signin_with'
  });
}

function renderAuthUI(user){
  const container = document.getElementById('authContainer');
  if(!container) return;

  if(user){
    container.innerHTML = `
      <div class="auth-user">
        <img class="auth-avatar" src="${user.picture}" alt="${user.name}" referrerpolicy="no-referrer">
        <span class="auth-name">${user.name}</span>
        <button id="authSignOutBtn" class="auth-signout" type="button">SIGN OUT</button>
      </div>
    `;
    document.getElementById('authSignOutBtn').addEventListener('click', signOut);
  } else {
    container.innerHTML = '<div id="googleSignInBtn" class="auth-btn-slot"></div>';
    renderGoogleButton();
  }
}

function signOut(){
  clearUser();
  if(window.google && window.google.accounts && window.google.accounts.id){
    google.accounts.id.disableAutoSelect();
  }
  renderAuthUI(null);
  window.dispatchEvent(new CustomEvent('fc-auth-changed', {detail: null}));
}

function initGoogleLogin(){
  const existingUser = loadUser();
  renderAuthUI(existingUser);

  function trySetup(attemptsLeft){
    if(window.google && window.google.accounts && window.google.accounts.id){
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      if(!existingUser){
        renderGoogleButton();
      }
    } else if(attemptsLeft > 0){
      setTimeout(() => trySetup(attemptsLeft - 1), 200);
    }
  }
  trySetup(25);
}

window.FunkinAuth = {
  init: initGoogleLogin,
  signOut: signOut,
  getCurrentUser: getCurrentUser
};

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initGoogleLogin);
} else {
  initGoogleLogin();
}
