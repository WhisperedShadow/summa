const socket = io();

// Get the local and remote audio elements
const localAudio = document.getElementById('local-audio');
const remoteAudio = document.getElementById('remote-audio');

// Set up the local media stream (audio)
let localStream;
navigator.mediaDevices.getUserMedia({ audio: true })
  .then((stream) => {
    localStream = stream;
    localAudio.srcObject = stream;
  })
  .catch((err) => {
    console.error('Error accessing audio', err);
  });

// Create a WebRTC PeerConnection
let peerConnection;
const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(iceServers);

  // Add local stream to peer connection
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Set up ICE candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };

  // Set up remote stream handling
  peerConnection.ontrack = (event) => {
    remoteAudio.srcObject = event.streams[0];
  };
}

// Send the offer to the signaling server
function createOffer() {
  createPeerConnection();

  peerConnection.createOffer()
    .then((offer) => {
      return peerConnection.setLocalDescription(offer);
    })
    .then(() => {
      socket.emit('offer', peerConnection.localDescription);
    })
    .catch((err) => {
      console.error('Error creating offer', err);
    });
}

// Handle incoming offers
socket.on('offer', (offer) => {
  createPeerConnection();
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
      return peerConnection.createAnswer();
    })
    .then((answer) => {
      return peerConnection.setLocalDescription(answer);
    })
    .then(() => {
      socket.emit('answer', peerConnection.localDescription);
    })
    .catch((err) => {
      console.error('Error handling offer', err);
    });
});

// Handle incoming answers
socket.on('answer', (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    .catch((err) => {
      console.error('Error setting remote description', err);
    });
});

// Handle incoming ICE candidates
socket.on('ice-candidate', (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    .catch((err) => {
      console.error('Error adding ICE candidate', err);
    });
});

// Call createOffer function to initiate communication
createOffer();
