document.addEventListener('DOMContentLoaded',event=>{
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
  let status           = document.querySelector('#status');
  let divPreCall       = document.querySelector('#divPreCall');
  let divCall          = document.querySelector('#divCall');
  //  Streaming.
  const localVideo     = document.querySelector('#localVideo');
  const remoteVideo    = document.querySelector('#remoteVideo');
  const audioSelect    = document.querySelector('select#audioSrc');
  const videoSelect    = document.querySelector('select#videoSrc');
  audioSelect.onchange = videoSelect.onchange = getMediaAndCall;
  let localStream;
  //  Eventos botones.
  idRemotePeer.value   = '';
  idRemotePeer.onkeyup = validateCallButton;
  idRemotePeer.onblur  = validateCallButton;
  callButton.onclick   = callPeer;
  deleteId.addEventListener('click',()=>{
    idRemotePeer.disabled = false;
    idRemotePeer.value    = '';
    idRemotePeer.focus();
    callButton.hidden    = false;
    callingButton.hidden = true;
    validateCallButton();
  });
  initialize();
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
      conn = null;
      status.innerHTML = "Connection destroyed. Please refresh";
    });
    peer.on('error', function (err) {
      alert('' + err);
    });
  };
  function validateCallButton(){
    if(idRemotePeer.value!='')
      callButton.disabled = false;
    else
      callButton.disabled = true;
  }
});