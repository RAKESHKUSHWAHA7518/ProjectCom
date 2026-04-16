import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectSocket, getSocket } from '../utils/socket';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, MessageSquare, Send, X } from 'lucide-react';

export default function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Buffer to hold ICE candidates that arrive before the remote description is set
  const pendingCandidates = useRef([]);

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [callDuration, setCallDuration] = useState(0);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef(null);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

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
          // Create an empty stream so the call can still connect
          stream = new MediaStream();
          setIsVideoOff(true);
          setIsMuted(true);
          if (isMounted) {
            setCallStatus('Joined as Viewer (No Camera/Mic)');
          }
        }

        if (!isMounted) {
          // If unmounted before stream resolves, kill it immediately
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const socket = connectSocket(user._id);

        // Ensure clean slate for listeners to avoid strict mode duplicates
        socket.off('user-connected');
        socket.off('offer');
        socket.off('answer');
        socket.off('ice-candidate');
        socket.off('user-disconnected');

        // 1. ATTACH LISTENERS FIRST
        // When another user connects
        socket.on('user-connected', async (userId) => {
          if (!isMounted) return;
          console.log('Peer connected:', userId);
          setCallStatus('Peer connected. Setting up call...');

          await createPeerConnection(socket, userId);

          // We are the caller
          const pc = peerConnectionRef.current;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('offer', {
            target: roomId,
            caller: socket.id,
            sdp: offer,
          });
        });

        // Receive offer
        socket.on('offer', async (data) => {
          if (!isMounted) return;
          console.log('Received offer');
          setCallStatus('Offer received. Connecting...');

          if (!peerConnectionRef.current) {
            await createPeerConnection(socket, data.caller);
          }
          const pc = peerConnectionRef.current;

          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          // Flush any ICE candidates that arrived early
          pendingCandidates.current.forEach(c => {
            if (c) {
              pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
            }
          });
          pendingCandidates.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            target: roomId,
            caller: socket.id,
            sdp: answer,
          });
        });

        // Receive answer
        socket.on('answer', async (data) => {
          if (!isMounted) return;
          console.log('Received answer');
          const pc = peerConnectionRef.current;

          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            // Flush any ICE candidates that arrived early
            pendingCandidates.current.forEach(c => {
              if (c) {
                pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
              }
            });
            pendingCandidates.current = [];
          }
        });

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

        // Receive ICE candidate
        socket.on('ice-candidate', (data) => {
          if (!isMounted) return;

          // data is the RTCIceCandidateInit object itself
          const pc = peerConnectionRef.current;

          if (pc && pc.remoteDescription) {
            // Safe to add immediately
            if (data) {
              pc.addIceCandidate(new RTCIceCandidate(data)).catch(err => console.error("ICE error", err));
            }
          } else {
            // Buffer it until setRemoteDescription is finished
            pendingCandidates.current.push(data);
          }
        });

        // User disconnected
        socket.on('user-disconnected', () => {
          if (!isMounted) return;
          setIsConnected(false);
          setCallStatus('Other participant left');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
        });

        // 2. EMIT JOIN ROOM LAST
        socket.emit('join-room', roomId, user._id);
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
      }
    };
  }, [roomId, user._id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

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
      console.log('Connection state change:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setCallStatus('Connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
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
      try {
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
      } catch (err) {
        console.warn('Could not switch back to camera after screen share, likely device in use.', err);
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) peerConnectionRef.current.removeTrack(sender);
        
        localStreamRef.current.getVideoTracks().forEach((t) => {
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
        } else {
          // If no video sender existed (blank stream fallback), we add it and renegotiate
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          const socket = getSocket();
          socket.emit('offer', {
            target: roomId,
            caller: socket.id,
            sdp: offer,
          });
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
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    const socket = getSocket();
    if (socket) {
      socket.emit('leave-room', roomId, user._id);
    }
    navigate('/sessions');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[radial-gradient(ellipse_at_top,_#1a1f35_0%,_#0d1117_70%)] flex flex-col">

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/30 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' : 'bg-amber-400'}`} />
          <span className="text-sm text-gray-300 font-medium">{callStatus}</span>
          {isConnected && (
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              {formatTime(callDuration)}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-600 bg-white/5 px-3 py-1 rounded-full">#{roomId?.slice(0, 8)}</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">

      {/* Video Area */}
      <div className={`flex-1 flex items-center justify-center p-3 sm:p-4 relative transition-all duration-300 ${isChatOpen ? 'md:pr-[320px]' : ''}`}>

        {/* Remote Video */}
        <div className="relative w-full h-full max-w-5xl bg-gray-900/80 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Waiting for participant...</p>
              </div>
            </div>
          )}
          {/* Participant name overlay */}
          {isConnected && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-medium">Participant</span>
            </div>
          )}
        </div>

        {/* Local Video PiP */}
        <div className="absolute bottom-20 right-3 sm:bottom-6 sm:right-6 w-28 h-20 sm:w-44 sm:h-32 bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-white/10 hover:scale-105 transition-transform">
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
          <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
            You
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`absolute right-0 top-0 bottom-0 w-full md:w-[320px] bg-gray-950 border-l border-white/5 flex flex-col transform transition-transform duration-300 z-40 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gray-900">
          <h3 className="text-white font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            In-Call Chat
          </h3>
          <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition">
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
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'items-end self-end ml-auto' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-500 mb-0.5 px-1">{isMe ? 'You' : msg.senderName}</span>
                  <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 rounded-tl-sm'}`}>
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

      {/* Controls */}
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
          <span className="text-[10px] text-gray-500">{isMuted ? 'Unmute' : 'Mute'}</span>
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
          <span className="text-[10px] text-gray-500">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
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
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </button>
          <span className="text-[10px] text-gray-500">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
        </div>

        {/* Chat Button */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
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
          <span className="text-[10px] text-gray-500">Chat</span>
        </div>

        {/* End Call */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={endCall}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-600/40 hover:bg-red-700 transition-all hover:scale-110"
            title="End Call"
          >
            <PhoneOff size={22} />
          </button>
          <span className="text-[10px] text-red-400">End Call</span>
        </div>

      </div>
    </div>
  );
}