document.addEventListener('DOMContentLoaded',event=>{
	let lastPeerId = null;
	let peer       = null;
	let peerId     = null;
	let conn       = null;
	function initialize(){
		//	Creamos la instancia.
		peer = new Peer(null, {
      debug: 2
    });
    //Debug: 0 Prints no logs. 1 Prints only errors. 2 Prints errors and warnings. 3 Prints all logs.
    peer.on('open', function (id) {
      // Workaround for peer.reconnect deleting previous id
      if (peer.id === null) {
        console.log('Received null id from peer open');
        peer.id = lastPeerId;
      } else {
        lastPeerId = peer.id;
      }

      console.log('ID: ' + peer.id);
      /*recvId.innerHTML = peer.id;
      status.innerHTML = "Awaiting connection...";*/
    });
	}
	initialize();
});