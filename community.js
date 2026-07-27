(function(){
  const WS_PATH = '/ws/community';
  let socket = null;
  let reconnectDelay = 1500;
  let offlineNoticeTimer = null;

  function getIdentity(){
    const user = window.FunkinAuth && window.FunkinAuth.getCurrentUser ? window.FunkinAuth.getCurrentUser() : null;
    if(user && user.name){
      return { name: user.name, avatar: user.picture || '' };
    }
    let guestId = null;
    try{
      guestId = localStorage.getItem('fc_guest_id');
    } catch(err){}
    if(!guestId){
      guestId = 'Guest' + Math.floor(Math.random() * 9000 + 1000);
      try{ localStorage.setItem('fc_guest_id', guestId); } catch(err){}
    }
    return { name: guestId, avatar: '' };
  }

  function setStatus(state){
    const el = document.getElementById('communityStatus');
    if(!el) return;
    el.classList.remove('online', 'offline', 'connecting');
    if(state === 'online'){
      el.textContent = 'ONLINE';
      el.classList.add('online');
    } else if(state === 'offline'){
      el.textContent = 'OFFLINE — retrying';
      el.classList.add('offline');
    } else {
      el.textContent = 'CONNECTING…';
      el.classList.add('connecting');
    }
  }

  function updateUserCount(count){
    const el = document.getElementById('communityCount');
    if(el) el.textContent = count + (count === 1 ? ' person online' : ' people online');
  }

  function formatTime(ts){
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function messageNode(msg){
    const row = document.createElement('div');
    row.className = 'community-msg';

    if(msg.avatar){
      const img = document.createElement('img');
      img.className = 'community-avatar';
      img.src = msg.avatar;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      row.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'community-avatar community-avatar-fallback';
      fallback.textContent = (msg.name || '?').trim().charAt(0).toUpperCase() || '?';
      row.appendChild(fallback);
    }

    const body = document.createElement('div');
    body.className = 'community-msg-body';

    const head = document.createElement('div');
    head.className = 'community-msg-head';

    const nameEl = document.createElement('span');
    nameEl.className = 'community-msg-name';
    nameEl.textContent = msg.name;

    const timeEl = document.createElement('span');
    timeEl.className = 'community-msg-time';
    timeEl.textContent = formatTime(msg.timestamp);

    head.appendChild(nameEl);
    head.appendChild(timeEl);

    const textEl = document.createElement('div');
    textEl.className = 'community-msg-text';
    textEl.textContent = msg.text;

    body.appendChild(head);
    body.appendChild(textEl);
    row.appendChild(body);

    return row;
  }

  function appendMessage(msg){
    const list = document.getElementById('communityMessages');
    if(!list) return;
    const wasAtBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    list.appendChild(messageNode(msg));
    if(wasAtBottom){
      list.scrollTop = list.scrollHeight;
    }
  }

  function renderHistory(historyMessages){
    const list = document.getElementById('communityMessages');
    if(!list) return;
    list.innerHTML = '';
    if(!historyMessages.length){
      const empty = document.createElement('div');
      empty.className = 'community-empty';
      empty.textContent = 'No messages yet — be the first to say something.';
      list.appendChild(empty);
    } else {
      historyMessages.forEach(msg => list.appendChild(messageNode(msg)));
    }
    list.scrollTop = list.scrollHeight;
  }

  function connect(){
    setStatus('connecting');
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    try{
      socket = new WebSocket(`${protocol}//${location.host}${WS_PATH}`);
    } catch(err){
      scheduleReconnect();
      return;
    }

    socket.addEventListener('open', () => {
      setStatus('online');
      reconnectDelay = 1500;
      clearTimeout(offlineNoticeTimer);
    });

    socket.addEventListener('message', (event) => {
      let data;
      try{ data = JSON.parse(event.data); } catch(err){ return; }
      if(data.type === 'history'){
        renderHistory(data.messages || []);
      } else if(data.type === 'message'){
        appendMessage(data.message);
      } else if(data.type === 'userCount'){
        updateUserCount(data.count);
      }
    });

    socket.addEventListener('close', scheduleReconnect);
    socket.addEventListener('error', () => { socket.close(); });
  }

  function scheduleReconnect(){
    setStatus('offline');
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 1.6, 20000);
  }

  function sendMessage(){
    const input = document.getElementById('communityInput');
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;
    if(!socket || socket.readyState !== WebSocket.OPEN){
      setStatus('offline');
      return;
    }
    const identity = getIdentity();
    socket.send(JSON.stringify({ type: 'message', name: identity.name, avatar: identity.avatar, text }));
    input.value = '';
  }

  function init(){
    const sendBtn = document.getElementById('communitySendBtn');
    const input = document.getElementById('communityInput');
    if(sendBtn) sendBtn.addEventListener('click', sendMessage);
    if(input){
      input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' && !e.shiftKey){
          e.preventDefault();
          sendMessage();
        }
      });
    }
    connect();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
