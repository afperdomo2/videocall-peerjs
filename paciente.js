document.addEventListener('DOMContentLoaded',event=>{
  let clipboard = new Clipboard('.copy');
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
  //  Streaming.
  const localVideo     = document.querySelector('#localVideo');
  const remoteVideo    = document.querySelector('#remoteVideo');
  const audioSelect    = document.querySelector('select#audioSrc');
  const videoSelect    = document.querySelector('select#videoSrc');
  audioSelect.onchange = videoSelect.onchange = getMediaAndAnswer;
  let localStream;
  answerCall.onclick   = getMediaAndAnswer;
  initialize();
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
      conn = null;
      status.innerHTML = "Connection destroyed. Please refresh";
      console.log('Connection destroyed');
    });
    peer.on('error', function (err) {
      console.log(err);
      alert('' + err);
    });
  };
  function gotStream(stream) {
    localVideo.srcObject = stream;
    localStream = stream;
  }
  function gotRemoteStream(stream) {
    remoteVideo.srcObject = stream;
  }
});