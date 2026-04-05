import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectSocket, getSocket } from '../utils/socket';

export default function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  useEffect(() => {
    if (!roomId) return;
    startCall();

    return () => {
      cleanup();
    };
  }, [roomId]);

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    const socket = getSocket();
    socket.emit('leave-room', roomId, user._id);
    socket.off('user-connected');
    socket.off('offer');
    socket.off('answer');
    socket.off('ice-candidate');
    socket.off('user-disconnected');
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const socket = connectSocket(user._id);
      socket.emit('join-room', roomId, user._id);
      setCallStatus('Waiting for other participant...');

      // When another user connects
      socket.on('user-connected', async (userId) => {
        setCallStatus('Peer connected. Setting up call...');
        await createPeerConnection(socket, userId);

        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        socket.emit('offer', {
          target: roomId,
          caller: socket.id,
          sdp: offer,
        });
      });

      // Receive offer
      socket.on('offer', async (data) => {
        await createPeerConnection(socket, data.caller);
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp)
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit('answer', {
          target: roomId,
          caller: socket.id,
          sdp: answer,
        });
      });

      // Receive answer
      socket.on('answer', async (data) => {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp)
        );
      });

      // Receive ICE candidate
      socket.on('ice-candidate', (candidate) => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      // User disconnected
      socket.on('user-disconnected', () => {
        setIsConnected(false);
        setCallStatus('Other participant left');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      setCallStatus('Failed to access camera/microphone');
    }
  };

  const createPeerConnection = async (socket, targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    // When we receive remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsConnected(true);
        setCallStatus('Connected');
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        setCallStatus('Connection lost');
      }
    };
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Switch back to camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];

      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);

      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
      localStreamRef.current.addTrack(videoTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen sharing failed:', err);
      }
    }
  };

  const endCall = () => {
    cleanup();
    navigate('/sessions');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-sm text-gray-300 font-medium">{callStatus}</span>
        </div>
        <span className="text-sm text-gray-500">Room: {roomId?.slice(0, 8)}...</span>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center p-4 gap-4 relative">
        {/* Remote Video (large) */}
        <div className="relative w-full h-full max-w-5xl bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-600 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Waiting for participant...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (small overlay) */}
        <div className="absolute bottom-8 right-8 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-gray-700/50 hover:scale-105 transition-transform cursor-move">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <span className="text-2xl">🙈</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-6 bg-gray-800/80 backdrop-blur">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
            isMuted
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
            isVideoOff
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
        >
          {isVideoOff ? '📷' : '🎥'}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
            isScreenSharing
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          🖥️
        </button>

        <button
          onClick={endCall}
          className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-red-600/30 hover:bg-red-700 transition-all hover:scale-110"
          title="End Call"
        >
          📞
        </button>
      </div>
    </div>
  );
}
