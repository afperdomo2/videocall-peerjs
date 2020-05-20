(function (window,document) {
  //  Video Call.
  let lastPeerId       = null;
  let peer             = null;
  let peerId           = null;
  let conn             = null;
  let call             = null;
  let idRemotePeer     = document.querySelector('#idRemotePeer');
  let deleteId         = document.querySelector('#deleteId');
  let callButton       = document.querySelector('#callButton');
  let callingButton    = document.querySelector('#callingButton');
  let hangupButton     = document.querySelector('#hangupButton');
  let mutedButton      = document.querySelector('#mutedButton');
  let status           = document.querySelector('#status');
  let divPreCall       = document.querySelector('#divPreCall');
  let divCall          = document.querySelector('#divCall');
  //  Chat.
  let messageBox       = document.querySelector('#messageBox');
  let sendButton       = document.querySelector('#sendMessageButton');
  let message          = document.querySelector('#message');
  //  Streaming.
  const localVideo     = document.querySelector('#localVideo');
  const remoteVideo    = document.querySelector('#remoteVideo');
  const audioSelect    = document.querySelector('select#audioSrc');
  const videoSelect    = document.querySelector('select#videoSrc');
  audioSelect.onchange = videoSelect.onchange = getMediaAndCall;
  let localStream;
  idRemotePeer.value   = '';
  //  Eventos botones.
  idRemotePeer.onkeyup = validateCallButton;
  idRemotePeer.onblur  = validateCallButton;
  //callButton.onclick = callPeer;
  callButton.onclick   = join;
  hangupButton.onclick = hangupCall;
  sendButton.onclick   = sendMessage;
  mutedButton.onclick  = mutedSound;
  deleteId.addEventListener('click',()=>{
    idRemotePeer.disabled = false;
    idRemotePeer.value    = '';
    idRemotePeer.focus();
    callButton.hidden    = false;
    callingButton.hidden = true;
    validateCallButton();
  });
  initialize();
  function mutedSound()
  {
    if(remoteVideo.muted==false){
      mutedButton.textContent = 'Activar Sonido';
      remoteVideo.muted = true;
    }else{
      mutedButton.textContent = 'Desactivar Sonido';
      remoteVideo.muted = false;
    }
  }
  function hangupCall()
  {
    localVideo.srcObject  = null;
    remoteVideo.srcObject = null;
    localStream.getTracks().forEach(track => track.stop());
    conn.close();
    conn = null;
    call.close();
    call = null;
  }
  function callPeer()
  {
    idRemotePeer.disabled = true;
    callButton.hidden     = true;
    callingButton.hidden  = false;
    getMediaAndCall();
  }
  async function getMediaAndCall()
  {
    if (localStream) {
      localVideo.srcObject = null;
      localStream.getTracks().forEach(track => track.stop());
    }
    const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
      audio: { optional: [{ sourceId: audioSource }] },
      video: { optional: [{ sourceId: videoSource }] }
    };
    try {
      const userMedia = await navigator.mediaDevices.getUserMedia(constraints);
      gotStream(userMedia);
      call = peer.call(idRemotePeer.value,userMedia);
      call.on('stream', function(stream) {
        gotRemoteStream(stream);
        divPreCall.hidden = true;
        divCall.hidden    = false;
      });
    } catch (e) {
      console.log('navigator.getUserMedia error: ', e);
    }
  }
  function gotStream(stream) {
    localVideo.srcObject = stream;
    localStream          = stream;
  }
  function gotRemoteStream(stream) {
    remoteVideo.srcObject = stream;
  }
  //  Creamos el objeto Peer y configuramos los escuchadores.
  function initialize() {
    peer = new Peer(null, {
      debug: 2,
      config: {'iceServers': [
        { url: 'stun:stun.l.google.com:19302' },
        { url: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'webrtc@live.com' }
      ]}
    });
    peer.on('open', function (id) {
      if (peer.id === null)
        peer.id = lastPeerId;
      else
        lastPeerId = peer.id;
      idRemotePeer.disabled = false;
      idRemotePeer.focus();
      status.innerHTML = `Tu ID es: ${peer.id}<br>`;
    });
    peer.on('connection', function (connRemotePeer) {
      // No permite conexiones entrantes.
      connRemotePeer.on('open', function() {
        connRemotePeer.send("El remitente no acepta conexiones entrantes.");
        setTimeout(function() { connRemotePeer.close(); }, 500);
      });
    });
    peer.on('disconnected', function () {
      status.innerHTML = "Connection lost. Please reconnect";
      peer.id = lastPeerId;
      peer._lastServerId = lastPeerId;
      peer.reconnect();
    });
    peer.on('close', function() {
      hangupCall();
      status.innerHTML = "Connection destroyed. Please refresh";
    });
    peer.on('error', function (err) {
      alert('' + err);
    });
  };
  function join() {
    // Cierra la conexión vieja.
    if (conn) {
      conn.close();
    }
    // Crea una conexión con el par destino.
    conn = peer.connect(idRemotePeer.value, { reliable: true });
    conn.on('open', function () {
      status.innerHTML = "Connected to: " + conn.peer;
      conn.send(`<b class="text-success"><span class="icon-user-check"></span> El médico está conectado.</b>`);
      callPeer();
    });
    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
      addMessage(`<span class=\"peerMsg\"><b class=\"text-danger\">Paciente:</b></span> ${data}`);
    });
    conn.on('close', function () {
      status.innerHTML = "Connection closed";
    });
  };
  function addMessage(msg) {
    let now = new Date();
    let h = now.getHours();
    let m = addZero(now.getMinutes());
    let s = addZero(now.getSeconds());
    if (h > 12)
      h -= 12;
    else if (h === 0)
      h = 12;
    function addZero(t) {
      if (t < 10)
        t = "0" + t;
      return t;
    }
    message.innerHTML = `<br><span class=\"msg-time\">${h}:${m}:${s}h</span> - ${msg} ${message.innerHTML}`;
  }
  messageBox.addEventListener('keypress', function (e) {
    let event = e || window.event;
    let char = event.which || event.keyCode;
    if (char == '13')
      sendMessage();
  })
  function sendMessage()
  {
    if (conn && conn.open) {
      let msg = messageBox.value;
      messageBox.value = '';
      conn.send(msg);
      addMessage(`<span class=\"selfMsg\"><b class=\"text-info\">Yo</b>: </span>${msg}`);
    } else {
      console.log('Connection is closed');
    }
  }
  function validateCallButton(){
    if(idRemotePeer.value!='')
      callButton.disabled = false;
    else
      callButton.disabled = true;
  }
})(window,document);