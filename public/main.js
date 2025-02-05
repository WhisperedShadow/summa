const socket = io();

const localAudio = document.getElementById('local-audio');
const remoteAudio = document.getElementById('remote-audio');

let localStream;
navigator.mediaDevices.getUserMedia({ audio: true })
  .then((stream) => {
    localStream = stream;
    localAudio.srcObject = stream;
  })
  .catch((err) => {
    console.error('Error accessing audio', err);
  });

let peerConnection;
const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(iceServers);
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate:", event.candidate);
      socket.emit('ice-candidate', event.candidate);
    }
  };

  peerConnection.ontrack = (event) => {
    console.log("Received remote stream");
    remoteAudio.srcObject = event.streams[0];
  };
}

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

socket.on('offer', (offer) => {
  console.log("Received offer:", offer);
  createPeerConnection();
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
      return peerConnection.createAnswer();
    })
    .then((answer) => {
      console.log("Sending answer:", answer);
      return peerConnection.setLocalDescription(answer);
    })
    .then(() => {
      socket.emit('answer', peerConnection.localDescription);
    })
    .catch((err) => {
      console.error('Error handling offer', err);
    });
});

socket.on('answer', (answer) => {
  console.log("Received answer:", answer);
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    .catch((err) => {
      console.error('Error setting remote description', err);
    });
});

socket.on('ice-candidate', (candidate) => {
  console.log("Received ICE candidate:", candidate);
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    .catch((err) => {
      console.error('Error adding ICE candidate', err);
    });
});

createOffer();
