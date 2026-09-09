import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectSocket, getSocket } from '../utils/socket';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, MessageSquare, Send, X, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function VideoCall() {
  const { t } = useTranslation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // Buffer to hold ICE candidates that arrive before the remote description is set
  const pendingCandidates = useRef([]);

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [callDuration, setCallDuration] = useState(0);

  // Remote participant states
  const [remoteUser, setRemoteUser] = useState(null);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [hasRemoteVideoTrack, setHasRemoteVideoTrack] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef(null);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // STUN + Free Public TURN Servers for reliable NAT traversal across networks
  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelay',
        credential: 'openrelay',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelay',
        credential: 'openrelay',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelay',
        credential: 'openrelay',
      },
    ],
  };

  const flushPendingCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) return;
    const queued = [...pendingCandidates.current];
    pendingCandidates.current = [];
    for (const candidate of queued) {
      if (candidate) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.warn('Error adding buffered ICE candidate:', err);
        }
      }
    }
  };

  // WebRTC peer connection setup
  const createPeerConnection = useCallback(async (socket) => {
    // If existing pc exists, clean it up first
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn('Error closing existing peer connection:', e);
      }
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (audioTrack) {
      pc.addTrack(audioTrack, localStreamRef.current);
    } else {
      // Ensure we can receive audio even if local mic is missing
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    if (videoTrack) {
      pc.addTrack(videoTrack, localStreamRef.current);
    } else {
      // Ensure we can receive video even if local camera is missing
      pc.addTransceiver('video', { direction: 'recvonly' });
    }

    // When we receive remote tracks
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, event.streams);

      let stream = remoteStreamRef.current;
      if (!stream) {
        stream = new MediaStream();
        remoteStreamRef.current = stream;
      }

      // Add track to stream if not already present
      const existingTrackIds = stream.getTracks().map((t) => t.id);
      if (!existingTrackIds.includes(event.track.id)) {
        stream.addTrack(event.track);
      }

      if (event.track.kind === 'video') {
        setHasRemoteVideoTrack(true);
        setIsRemoteVideoOff(!event.track.enabled);

        event.track.onmute = () => setIsRemoteVideoOff(true);
        event.track.onunmute = () => setIsRemoteVideoOff(false);
        event.track.onended = () => {
          setHasRemoteVideoTrack(false);
          setIsRemoteVideoOff(true);
        };
      }

      if (event.track.kind === 'audio') {
        event.track.onmute = () => setIsRemoteMuted(true);
        event.track.onunmute = () => setIsRemoteMuted(false);
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        const playPromise = remoteVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setAutoplayBlocked(false))
            .catch((err) => {
              console.warn('Autoplay blocked on remote video:', err);
              setAutoplayBlocked(true);
            });
        }
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candData = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
        socket.emit('ice-candidate', {
          target: roomId,
          candidate: candData,
        });
      }
    };

    const updateConnectionStatus = () => {
      const connState = pc.connectionState;
      const iceState = pc.iceConnectionState;
      console.log(`Connection state: ${connState} | ICE state: ${iceState}`);

      if (connState === 'connected' || iceState === 'connected' || iceState === 'completed') {
        setIsConnected(true);
        setCallStatus('Connected');
      } else if (connState === 'connecting' || iceState === 'checking') {
        setCallStatus('Connecting media...');
      } else if (connState === 'disconnected' || iceState === 'disconnected') {
        setCallStatus('Connection interrupted...');
      } else if (connState === 'failed' || iceState === 'failed') {
        setIsConnected(false);
        setCallStatus('Connection failed. Retrying...');
        if (pc.restartIce) {
          pc.restartIce();
        }
      }
    };

    pc.onconnectionstatechange = updateConnectionStatus;
    pc.oniceconnectionstatechange = updateConnectionStatus;

    return pc;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    let localStream = null;

    const initCall = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (isMounted) {
            setCallStatus('Camera unavailable: open on HTTPS or localhost');
          }
          return;
        }

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (mediaErr) {
          console.warn('Could not access camera/mic, joining with no media. Error:', mediaErr);
          stream = new MediaStream();
          setIsVideoOff(true);
          setIsMuted(true);
          if (isMounted) {
            setCallStatus('Joined as Viewer (No Camera/Mic)');
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const socket = connectSocket(user._id);

        // Ensure clean slate for listeners to avoid duplicates
        socket.off('user-connected');
        socket.off('offer');
        socket.off('answer');
        socket.off('ice-candidate');
        socket.off('user-disconnected');
        socket.off('video-chat-message');
        socket.off('toggle-media');

        const userInfo = {
          userId: user._id,
          name: user.name || 'User',
          avatar: user.avatar || '',
        };

        // 1. ATTACH LISTENERS FIRST
        // When another user connects
        socket.on('user-connected', async (peerData) => {
          if (!isMounted) return;
          console.log('Peer connected:', peerData);

          if (peerData && typeof peerData === 'object') {
            setRemoteUser(peerData);
          } else if (typeof peerData === 'string') {
            setRemoteUser({ userId: peerData, name: 'Participant' });
          }

          setCallStatus('Participant joined. Setting up call...');

          const pc = await createPeerConnection(socket);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('offer', {
            target: roomId,
            caller: socket.id,
            sdp: offer,
            senderInfo: userInfo,
          });
        });

        // Receive offer
        socket.on('offer', async (data) => {
          if (!isMounted) return;
          console.log('Received offer', data);
          if (data.senderInfo) {
            setRemoteUser(data.senderInfo);
          }
          setCallStatus('Offer received. Connecting...');

          const pc = await createPeerConnection(socket);
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await flushPendingCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            target: roomId,
            caller: socket.id,
            sdp: answer,
            senderInfo: userInfo,
          });
        });

        // Receive answer
        socket.on('answer', async (data) => {
          if (!isMounted) return;
          console.log('Received answer');
          if (data.senderInfo) {
            setRemoteUser(data.senderInfo);
          }
          const pc = peerConnectionRef.current;

          if (pc && (pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-pranswer')) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await flushPendingCandidates(pc);
          }
        });

        // In-call chat
        socket.on('video-chat-message', (data) => {
          if (!isMounted) return;
          setMessages((prev) => [...prev, data]);
          setIsChatOpen((prevChatOpen) => {
            if (!prevChatOpen) {
              setUnreadCount((c) => c + 1);
            }
            return prevChatOpen;
          });
        });

        // Toggle media state from remote peer
        socket.on('toggle-media', (data) => {
          if (!isMounted || !data) return;
          if (data.type === 'video') {
            setIsRemoteVideoOff(!data.enabled);
          } else if (data.type === 'audio') {
            setIsRemoteMuted(!data.enabled);
          }
        });

        // Receive ICE candidate
        socket.on('ice-candidate', async (data) => {
          if (!isMounted || !data) return;
          const pc = peerConnectionRef.current;

          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(data);
            } catch (err) {
              console.warn('Error adding incoming ICE candidate:', err);
            }
          } else {
            pendingCandidates.current.push(data);
          }
        });

        // User disconnected
        socket.on('user-disconnected', () => {
          if (!isMounted) return;
          setIsConnected(false);
          setCallStatus('Other participant left');
          setRemoteUser(null);
          setHasRemoteVideoTrack(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach((track) => track.stop());
            remoteStreamRef.current = null;
          }
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
        });

        // 2. EMIT JOIN ROOM LAST
        socket.emit('join-room', roomId, userInfo);
        setCallStatus('Waiting for other participant...');

      } catch (err) {
        console.error('Failed to start call completely:', err);
        if (isMounted) {
          setCallStatus('Failed to start call');
        }
      }
    };

    initCall();

    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      const socket = getSocket();
      if (socket) {
        socket.emit('leave-room', roomId, user._id);
        socket.off('user-connected');
        socket.off('offer');
        socket.off('answer');
        socket.off('ice-candidate');
        socket.off('user-disconnected');
        socket.off('video-chat-message');
        socket.off('toggle-media');
      }
    };
  }, [roomId, user._id, user.name, user.avatar, createPeerConnection]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      senderId: user._id,
      senderName: user.name,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    const socket = getSocket();
    if (socket) {
      socket.emit('video-chat-message', { target: roomId, message: msg });
    }
    setNewMessage('');
  };

  // Call duration timer
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const nextMuted = !audioTrack.enabled;
      setIsMuted(nextMuted);
      const socket = getSocket();
      if (socket) {
        socket.emit('toggle-media', { target: roomId, type: 'audio', enabled: !nextMuted });
      }
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const nextVideoOff = !videoTrack.enabled;
      setIsVideoOff(nextVideoOff);
      const socket = getSocket();
      if (socket) {
        socket.emit('toggle-media', { target: roomId, type: 'video', enabled: !nextVideoOff });
      }
    }
  };

  const handleUnblockAutoplay = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch((err) => console.warn('User-initiated play error:', err));
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Switch back to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];

        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);

        localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
        if (localStreamRef.current) {
          const oldVideo = localStreamRef.current.getVideoTracks()[0];
          if (oldVideo) localStreamRef.current.removeTrack(oldVideo);
          localStreamRef.current.addTrack(videoTrack);
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      } catch (err) {
        console.warn('Could not switch back to camera after screen share:', err);
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) peerConnectionRef.current.removeTrack(sender);

        localStreamRef.current?.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current.removeTrack(t);
        });
      }

      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(screenTrack);
        } else if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          const socket = getSocket();
          if (socket) {
            socket.emit('offer', {
              target: roomId,
              caller: socket.id,
              sdp: offer,
              senderInfo: { userId: user._id, name: user.name, avatar: user.avatar },
            });
          }
        }

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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    const socket = getSocket();
    if (socket) {
      socket.emit('leave-room', roomId, user._id);
    }
    navigate('/sessions');
  };

  const remoteDisplayName = remoteUser?.name || 'Participant';
  const remoteAvatarInitial = remoteDisplayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-[radial-gradient(ellipse_at_top,_#1a1f35_0%,_#0d1117_70%)] flex flex-col">

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/30 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected
                ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="text-sm text-gray-300 font-medium">{callStatus}</span>
          {isConnected && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              {formatTime(callDuration)}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
          #{roomId?.slice(0, 8)}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Video Area */}
        <div className={`flex-1 flex items-center justify-center p-3 sm:p-4 relative transition-all duration-300 ${isChatOpen ? 'md:pr-[320px]' : ''}`}>

          {/* Remote Video Container */}
          <div className="relative w-full h-full max-w-5xl bg-gray-900/80 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center">
            
            {/* The actual video element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isConnected && !isRemoteVideoOff && hasRemoteVideoTrack ? 'opacity-100 block' : 'opacity-0 hidden'
              }`}
            />

            {/* Waiting for other participant */}
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center p-6 max-w-sm">
                  <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <h4 className="text-white font-semibold mb-1">Connecting to Room</h4>
                  <p className="text-gray-400 text-sm">{callStatus}</p>
                </div>
              </div>
            )}

            {/* Remote camera is OFF / Audio only overlay */}
            {isConnected && (isRemoteVideoOff || !hasRemoteVideoTrack) && (
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-gray-950 flex flex-col items-center justify-center gap-4 p-6">
                <div className="relative">
                  {remoteUser?.avatar ? (
                    <img
                      src={remoteUser.avatar}
                      alt={remoteDisplayName}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white/10 shadow-2xl"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl ring-4 ring-white/10">
                      {remoteAvatarInitial}
                    </div>
                  )}
                  {isRemoteMuted && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 p-2 rounded-full shadow-lg border-2 border-gray-900 text-white">
                      <MicOff size={16} />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-white text-lg font-semibold">{remoteDisplayName}</h3>
                  <p className="text-gray-400 text-xs mt-1 flex items-center justify-center gap-1.5">
                    <VideoOff size={14} className="text-amber-400" />
                    Camera is off {isRemoteMuted && '• Muted'}
                  </p>
                </div>
              </div>
            )}

            {/* Autoplay blocked prompt */}
            {autoplayBlocked && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600/90 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-sm font-medium transition cursor-pointer z-30"
                   onClick={handleUnblockAutoplay}>
                <Volume2 size={18} className="animate-pulse" />
                <span>Click to enable remote audio & video</span>
              </div>
            )}

            {/* Remote Participant Label */}
            {isConnected && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 z-20">
                <div className={`w-2 h-2 rounded-full ${isRemoteVideoOff ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-white text-xs font-medium">{remoteDisplayName}</span>
                {isRemoteMuted && <MicOff size={12} className="text-red-400" />}
              </div>
            )}
          </div>

          {/* Local Video PiP */}
          <div className="absolute bottom-20 right-3 sm:bottom-6 sm:right-6 w-28 h-20 sm:w-44 sm:h-32 bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-white/10 hover:scale-105 transition-transform z-30">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'Y'}
                </div>
                <span className="text-[10px] text-gray-500">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <span>You</span>
              {isMuted && <MicOff size={10} className="text-red-400" />}
            </div>
          </div>
        </div>

        {/* In-Call Chat Panel */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-full md:w-[320px] bg-gray-950 border-l border-white/5 flex flex-col transform transition-transform duration-300 z-40 ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gray-900">
            <h3 className="text-white font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              In-Call Chat
            </h3>
            <button
              onClick={closeChat}
              className="text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Say hi to everyone!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user._id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      isMe ? 'items-end self-end ml-auto' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] text-gray-500 mb-0.5 px-1">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <div
                      className={`px-3 py-2 rounded-xl text-sm ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-sm'
                          : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-3 bg-gray-900 border-t border-white/5">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 bg-gray-800/80 border border-white/5 text-sm text-white rounded-full px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 placeholder-gray-500"
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 px-4 py-4 sm:py-6 bg-black/40 backdrop-blur-sm border-t border-white/5">

        {/* Mute */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isMuted
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                : 'bg-white/10 text-gray-200 hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <span className="text-[10px] text-gray-400">{isMuted ? 'Unmute' : 'Mute'}</span>
        </div>

        {/* Camera */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isVideoOff
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600'
                : 'bg-white/10 text-gray-200 hover:bg-white/20'
            }`}
            title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
          <span className="text-[10px] text-gray-400">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
        </div>

        {/* Screen Share */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isScreenSharing
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600'
                : 'bg-white/10 text-gray-200 hover:bg-white/20'
            }`}
            title={isScreenSharing ? t('Stop Screen') : t('Share Screen')}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>
          <span className="text-[10px] text-gray-400">
            {isScreenSharing ? t('Stop Screen') : t('Share Screen')}
          </span>
        </div>

        {/* Chat Button */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={toggleChat}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 relative ${
              isChatOpen
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600'
                : 'bg-white/10 text-gray-200 hover:bg-white/20'
            }`}
            title="Chat"
          >
            <MessageSquare size={20} />
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-gray-900 shrink-0">
                {unreadCount}
              </span>
            )}
          </button>
          <span className="text-[10px] text-gray-400">Chat</span>
        </div>

        {/* End Call */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={endCall}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/40 hover:bg-red-700 transition-all hover:scale-110"
            title={t('End Session')}
          >
            <PhoneOff size={22} />
          </button>
          <span className="text-[10px] text-red-400">{t('End Session')}</span>
        </div>

      </div>
    </div>
  );
}