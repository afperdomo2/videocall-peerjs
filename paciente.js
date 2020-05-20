(function (window,document) {
  //  Video Call.
   let lastPeerId       = null;
   let peer             = null;
   let peerId           = null;
   let conn             = null;
   let call             = null;
   let idLocalPeer      = document.querySelector('#idLocalPeer');
   let status           = document.querySelector('#status');
   let alertCall        = document.querySelector('#alertCall');
   let answerCall       = document.querySelector('#answerCall');
   let divPreCall       = document.querySelector('#divPreCall');
   let divCall          = document.querySelector('#divCall');
   let hangupButton     = document.querySelector('#hangupButton');
   let mutedButton      = document.querySelector('#mutedButton');
   //  Chat.
   let messageBox       = document.querySelector('#messageBox');
   let sendButton       = document.querySelector('#sendMessageButton');
   let message          = document.querySelector('#message');
   //  Streaming.
   const localVideo     = document.querySelector('#localVideo');
   const remoteVideo    = document.querySelector('#remoteVideo');
   const audioSelect    = document.querySelector('select#audioSrc');
   const videoSelect    = document.querySelector('select#videoSrc');
   audioSelect.onchange = videoSelect.onchange = getMediaAndAnswer;
   let localStream;
   //  Eventos botones.
   hangupButton.onclick = hangupCall;
   answerCall.onclick   = getMediaAndAnswer;
   sendButton.onclick   = sendMessage;
   mutedButton.onclick  = mutedSound;
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
  async function getMediaAndAnswer()
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
      call.answer(userMedia);
      gotStream(userMedia);
      divPreCall.hidden = true;
      alertCall.hidden  = true;
      divCall.hidden    = false;
    } catch (e) {
      console.log('navigator.getUserMedia error: ', e);
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
  //  Creamos el objeto Peer y configuramos los escuchadores.
  function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer(null, {
      debug: 2,
      config: {'iceServers': [
        { url: 'stun:stun.l.google.com:19302' },
        { url: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'webrtc@live.com' }
      ]}
    });
    //  Al establecerse una conexión con PeerServer.
    peer.on('open', function (id) {
      if (peer.id === null)
        peer.id = lastPeerId;// Recibe ID null para conexiones abiertas.
      else
        lastPeerId = peer.id;
      idLocalPeer.value = peer.id;
      status.innerHTML = `Tu ID es: ${peer.id}<br>`;
    });
    //  Al realizarse una llamada.
    peer.on('call', function(callRemotePeer) {
      alertCall.hidden = false;
      call = callRemotePeer;
      call.on('stream', function(stream) {
        gotRemoteStream(stream);
      });
    });
    peer.on('connection', function (connRemotePeer) {
      //  Permite una sola conexión.
      if (conn && conn.open) {
        connRemotePeer.on('open', function() {
          connRemotePeer.send("Already connected to another client");
          setTimeout(function() { connRemotePeer.close(); }, 500);
        });
        return;
      }
      conn = connRemotePeer;
      console.log("Connected to: " + conn.peer);
      status.innerHTML = "Connected";
      conn.send(`<b class="text-success"><span class="icon-user-check"></span> El paciente está conectado.</b>`);
      ready();
    });
    peer.on('disconnected', function () {
      status.innerHTML = "Connection lost. Please reconnect";
      console.log('Connection lost. Please reconnect');
      // Workaround for peer.reconnect deleting previous id
      peer.id = lastPeerId;
      peer._lastServerId = lastPeerId;
      peer.reconnect();
    });
    peer.on('close', function() {
      hangupCall();
    });
    peer.on('error', function (err) {
      console.log(err);
      alert('' + err);
    });
  };
  function ready() {
    conn.on('open', function () {
      conn.send(`<b class="text-success"><span class="icon-user-check"></span> El paciente está conectado.</b>`);
    });
    conn.on('data', function (data) {
      addMessage("<span class=\"peerMsg\"><b class=\"text-danger\">Médico</b>: </span>" + data);
    });
    conn.on('close', function () {
      status.innerHTML = "Connection closed";
    });
  }
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
    message.innerHTML = `<br><span class=\"msg-time\">${h}:${m}:${s}</span> - ${msg} ${message.innerHTML}`;
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
  function gotStream(stream) {
    localVideo.srcObject = stream;
    localStream = stream;
  }
  function gotRemoteStream(stream) {
    remoteVideo.srcObject = stream;
  }
})(window,document);