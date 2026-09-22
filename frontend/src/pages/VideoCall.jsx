import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { connectSocket, getSocket } from '../utils/socket';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
  MessageSquare, Send, X, Volume2, ArrowLeft, Users, Clock,
  Maximize2, Minimize2
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelay', credential: 'openrelay' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelay', credential: 'openrelay' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelay', credential: 'openrelay' },
  ],
};

/* ── Small reusable control button ── */
function CtrlBtn({ onClick, active, danger, activeColor = 'bg-red-500 shadow-red-500/40', label, children, badge }) {
  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <button
        onClick={onClick}
        title={label}
        className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20
          ${danger
            ? 'bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-lg shadow-red-600/40'
            : active
              ? `${activeColor} text-white shadow-lg`
              : 'bg-white/[0.08] hover:bg-white/[0.15] text-gray-300 hover:text-white border border-white/[0.06]'
          }`}
      >
        {children}
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-black px-0.5">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
      <span className={`text-[10px] font-medium leading-none ${danger ? 'text-red-400' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}`}>
        {label}
      </span>
    </div>
  );
}

export default function VideoCall() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidates = useRef([]);

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [callDuration, setCallDuration] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isPipExpanded, setIsPipExpanded] = useState(false);

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

  const flushPendingCandidates = async (pc) => {
    if (!pc || !pc.remoteDescription?.type) return;
    const queued = [...pendingCandidates.current];
    pendingCandidates.current = [];
    for (const candidate of queued) {
      if (candidate) {
        try { await pc.addIceCandidate(candidate); }
        catch (err) { console.warn('ICE candidate error:', err); }
      }
    }
  };

  const createPeerConnection = useCallback(async (socket) => {
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) { console.warn(e); }
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (audioTrack) pc.addTrack(audioTrack, localStreamRef.current);
    else pc.addTransceiver('audio', { direction: 'recvonly' });
    if (videoTrack) pc.addTrack(videoTrack, localStreamRef.current);
    else pc.addTransceiver('video', { direction: 'recvonly' });

    pc.ontrack = (event) => {
      let stream = remoteStreamRef.current;
      if (!stream) { stream = new MediaStream(); remoteStreamRef.current = stream; }
      const existingIds = stream.getTracks().map(t => t.id);
      if (!existingIds.includes(event.track.id)) stream.addTrack(event.track);

      if (event.track.kind === 'video') {
        setHasRemoteVideoTrack(true);
        setIsRemoteVideoOff(!event.track.enabled);
        event.track.onmute = () => setIsRemoteVideoOff(true);
        event.track.onunmute = () => setIsRemoteVideoOff(false);
        event.track.onended = () => { setHasRemoteVideoTrack(false); setIsRemoteVideoOff(true); };
      }
      if (event.track.kind === 'audio') {
        event.track.onmute = () => setIsRemoteMuted(true);
        event.track.onunmute = () => setIsRemoteMuted(false);
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play()
          .then(() => setAutoplayBlocked(false))
          .catch(() => setAutoplayBlocked(true));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candData = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
        socket.emit('ice-candidate', { target: roomId, candidate: candData });
      }
    };

    const updateStatus = () => {
      const cs = pc.connectionState, is = pc.iceConnectionState;
      if (cs === 'connected' || is === 'connected' || is === 'completed') { setIsConnected(true); setCallStatus('Connected'); }
      else if (cs === 'connecting' || is === 'checking') setCallStatus('Connecting media...');
      else if (cs === 'disconnected' || is === 'disconnected') setCallStatus('Connection interrupted...');
      else if (cs === 'failed' || is === 'failed') { setIsConnected(false); setCallStatus('Reconnecting...'); if (pc.restartIce) pc.restartIce(); }
    };
    pc.onconnectionstatechange = updateStatus;
    pc.oniceconnectionstatechange = updateStatus;
    return pc;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    let isMounted = true, localStream = null;

    const initCall = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          isMounted && setCallStatus('Camera unavailable: open on HTTPS or localhost');
          return;
        }
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch {
          stream = new MediaStream();
          setIsVideoOff(true); setIsMuted(true);
          isMounted && setCallStatus('Joined as viewer (no camera/mic)');
        }
        if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream; localStream = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const socket = connectSocket(user._id);
        ['user-connected', 'offer', 'answer', 'ice-candidate', 'user-disconnected', 'video-chat-message', 'toggle-media']
          .forEach(ev => socket.off(ev));

        const userInfo = { userId: user._id, name: user.name || 'User', avatar: user.avatar || '' };

        socket.on('user-connected', async (peerData) => {
          if (!isMounted) return;
          setRemoteUser(typeof peerData === 'object' ? peerData : { userId: peerData, name: 'Participant' });
          setCallStatus('Participant joined...');
          const pc = await createPeerConnection(socket);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { target: roomId, caller: socket.id, sdp: offer, senderInfo: userInfo });
        });

        socket.on('offer', async (data) => {
          if (!isMounted) return;
          if (data.senderInfo) setRemoteUser(data.senderInfo);
          setCallStatus('Connecting...');
          const pc = await createPeerConnection(socket);
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await flushPendingCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { target: roomId, caller: socket.id, sdp: answer, senderInfo: userInfo });
        });

        socket.on('answer', async (data) => {
          if (!isMounted) return;
          if (data.senderInfo) setRemoteUser(data.senderInfo);
          const pc = peerConnectionRef.current;
          if (pc && ['have-local-offer', 'have-remote-pranswer'].includes(pc.signalingState)) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            await flushPendingCandidates(pc);
          }
        });

        socket.on('video-chat-message', (data) => {
          if (!isMounted) return;
          setMessages(prev => [...prev, data]);
          setIsChatOpen(open => { if (!open) setUnreadCount(c => c + 1); return open; });
        });

        socket.on('toggle-media', (data) => {
          if (!isMounted || !data) return;
          if (data.type === 'video') setIsRemoteVideoOff(!data.enabled);
          else if (data.type === 'audio') setIsRemoteMuted(!data.enabled);
        });

        socket.on('ice-candidate', async (data) => {
          if (!isMounted || !data) return;
          const pc = peerConnectionRef.current;
          if (pc?.remoteDescription?.type) {
            try { await pc.addIceCandidate(data); } catch (err) { console.warn(err); }
          } else pendingCandidates.current.push(data);
        });

        socket.on('user-disconnected', () => {
          if (!isMounted) return;
          setIsConnected(false); setCallStatus('Participant left the call');
          setRemoteUser(null); setHasRemoteVideoTrack(false);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          remoteStreamRef.current?.getTracks().forEach(t => t.stop());
          remoteStreamRef.current = null;
          peerConnectionRef.current?.close(); peerConnectionRef.current = null;
        });

        socket.emit('join-room', roomId, userInfo);
        setCallStatus('Waiting for participant...');
      } catch (err) {
        console.error(err);
        isMounted && setCallStatus('Failed to start call');
      }
    };

    initCall();
    return () => {
      isMounted = false;
      localStream?.getTracks().forEach(t => t.stop());
      remoteStreamRef.current?.getTracks().forEach(t => t.stop());
      remoteStreamRef.current = null;
      peerConnectionRef.current?.close(); peerConnectionRef.current = null;
      const socket = getSocket();
      if (socket) {
        socket.emit('leave-room', roomId, user._id);
        ['user-connected', 'offer', 'answer', 'ice-candidate', 'user-disconnected', 'video-chat-message', 'toggle-media']
          .forEach(ev => socket.off(ev));
      }
    };
  }, [roomId, user._id, user.name, user.avatar, createPeerConnection]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
      getSocket()?.emit('toggle-media', { target: roomId, type: 'audio', enabled: track.enabled });
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
      getSocket()?.emit('toggle-media', { target: roomId, type: 'video', enabled: track.enabled });
    }
  };

  const toggleChat = () => {
    setIsChatOpen(prev => { if (!prev) setUnreadCount(0); return !prev; });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = { id: Date.now().toString(), senderId: user._id, senderName: user.name, text: newMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    getSocket()?.emit('video-chat-message', { target: roomId, message: msg });
    setNewMessage('');
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        localStreamRef.current?.getVideoTracks().forEach(t => t.stop());
        if (localStreamRef.current) {
          const old = localStreamRef.current.getVideoTracks()[0];
          if (old) localStreamRef.current.removeTrack(old);
          localStreamRef.current.addTrack(videoTrack);
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      } catch (err) {
        console.warn(err);
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) peerConnectionRef.current.removeTrack(sender);
        localStreamRef.current?.getVideoTracks().forEach(t => { t.stop(); localStreamRef.current.removeTrack(t); });
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        } else if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          getSocket()?.emit('offer', { target: roomId, caller: getSocket().id, sdp: offer, senderInfo: { userId: user._id, name: user.name, avatar: user.avatar } });
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch (err) { console.error(err); }
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    remoteStreamRef.current?.getTracks().forEach(t => t.stop());
    peerConnectionRef.current?.close();
    getSocket()?.emit('leave-room', roomId, user._id);
    navigate('/sessions');
  };

  const remoteDisplayName = remoteUser?.name || 'Participant';
  const remoteInitial = remoteDisplayName.charAt(0).toUpperCase();
  const myInitial = (user?.name || 'Y').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(160deg, #0d1117 0%, #111827 50%, #0a0f1e 100%)' }}>

      {/* ── Top Status Bar ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-black/50 backdrop-blur-md border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button */}
          <button
            onClick={() => setShowEndConfirm(true)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Leave call"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            <span className="text-xs sm:text-sm font-medium text-gray-300 truncate max-w-[120px] sm:max-w-none">
              {callStatus}
            </span>
          </div>

          {/* Duration timer */}
          {isConnected && (
            <div className="flex items-center gap-1.5 bg-white/[0.07] px-2.5 py-1 rounded-lg">
              <Clock size={12} className="text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 font-semibold">{formatTime(callDuration)}</span>
            </div>
          )}

          {/* Participant indicator */}
          {remoteUser && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white/[0.07] px-2.5 py-1 rounded-lg">
              <Users size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">2 participants</span>
            </div>
          )}
        </div>

        {/* Room ID */}
        <div className="flex items-center gap-2">
          {isScreenSharing && (
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/20">
              <Monitor size={12} />Sharing screen
            </span>
          )}
          <span className="text-xs text-gray-500 bg-white/[0.05] px-2.5 py-1 rounded-lg font-mono">
            #{roomId?.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* ── Main area: Video + Chat ── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">

        {/* Video stage — fills all available space */}
        <div className={`flex-1 flex relative transition-all duration-300 ${isChatOpen ? 'md:mr-[320px]' : ''}`}>

          {/* Remote video — completely fills the stage, no padding/gap */}
          <div className="relative flex-1 bg-black overflow-hidden">

            {/* Actual remote video — fills 100% */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isConnected && !isRemoteVideoOff && hasRemoteVideoTrack ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Waiting / Connecting state */}
            {!isConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8">
                {/* Animated rings */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-28 h-28 rounded-full border-2 border-primary-500/20 animate-ping" />
                  <div className="absolute w-20 h-20 rounded-full border-2 border-primary-500/30 animate-ping" style={{ animationDelay: '0.3s' }} />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/30 to-indigo-500/30 flex items-center justify-center border border-primary-500/40 backdrop-blur-sm">
                    <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-base mb-1">Waiting for participant</p>
                  <p className="text-gray-400 text-sm">{callStatus}</p>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 font-mono">
                  Room: {roomId?.slice(0, 16)}...
                </div>
              </div>
            )}

            {/* Remote camera off state */}
            {isConnected && (isRemoteVideoOff || !hasRemoteVideoTrack) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: 'linear-gradient(160deg, #111827 0%, #1f2937 100%)' }}>
                <div className="relative">
                  {remoteUser?.avatar ? (
                    <img
                      src={remoteUser.avatar}
                      alt={remoteDisplayName}
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white/10 shadow-2xl"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-2xl ring-4 ring-white/10">
                      {remoteInitial}
                    </div>
                  )}
                  {isRemoteMuted && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 p-1.5 rounded-full shadow-lg border-2 border-gray-900 text-white">
                      <MicOff size={14} />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-white text-base sm:text-lg font-semibold">{remoteDisplayName}</h3>
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <VideoOff size={12} className="text-amber-400" />Camera off
                    </span>
                    {isRemoteMuted && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MicOff size={12} className="text-red-400" />Muted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Autoplay blocked */}
            {autoplayBlocked && (
              <button
                onClick={() => remoteVideoRef.current?.play().then(() => setAutoplayBlocked(false)).catch(console.warn)}
                className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-indigo-600/95 hover:bg-indigo-500 text-white px-4 py-2 rounded-full shadow-2xl text-sm font-medium transition-all z-30 backdrop-blur-sm"
              >
                <Volume2 size={16} className="animate-pulse" />
                Click to enable audio & video
              </button>
            )}

            {/* Remote participant info label — bottom left */}
            {isConnected && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isRemoteVideoOff ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <span className="text-white text-xs font-semibold">{remoteDisplayName}</span>
                  {isRemoteMuted && <MicOff size={11} className="text-red-400" />}
                </div>
              </div>
            )}

            {/* Full screen hint */}
            <button
              onClick={() => document.documentElement.requestFullscreen?.()}
              className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white rounded-xl transition-all opacity-0 hover:opacity-100 focus:opacity-100 z-20"
              title="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* ── Self-view PiP — anchored above controls ── */}
          <div
            className={`absolute z-30 transition-all duration-300 right-3 sm:right-4 ${
              isPipExpanded
                ? 'bottom-3 w-52 h-40 sm:w-60 sm:h-44'
                : 'bottom-3 w-28 h-20 sm:w-40 sm:h-28'
            }`}
          >
            <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/15 group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Camera off overlay */}
              {isVideoOff && (
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold">
                    {myInitial}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">Camera off</span>
                </div>
              )}
              {/* Label */}
              <div className="absolute bottom-1.5 left-2 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded-md">
                <span className="text-[10px] text-white font-medium">You</span>
                {isMuted && <MicOff size={9} className="text-red-400" />}
              </div>
              {/* Expand/shrink toggle */}
              <button
                onClick={() => setIsPipExpanded(p => !p)}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-gray-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title={isPipExpanded ? 'Shrink' : 'Expand'}
              >
                {isPipExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── In-Call Chat Panel ── */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-full sm:w-[320px] flex flex-col transform transition-transform duration-300 z-40 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Chat header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                <MessageSquare size={14} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold leading-tight">In-Call Chat</h3>
                <p className="text-gray-500 text-[10px]">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-4 py-8">
                {/* Animated icon */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/20 flex items-center justify-center">
                    <MessageSquare size={24} className="text-emerald-400/70" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">0</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-300 text-sm font-semibold mb-1">No messages yet</p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Send a message to{' '}
                    <span className="text-gray-400 font-medium">{remoteDisplayName || 'your participant'}</span>
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user._id;
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] gap-1 ${isMe ? 'items-end ml-auto' : 'items-start'}`}>
                    <span className="text-[10px] text-gray-600 px-1">
                      {isMe ? 'You' : msg.senderName} · {time}
                    </span>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm'
                        : 'bg-white/[0.07] text-gray-100 rounded-tl-sm border border-white/[0.06]'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message input */}
          <div
            className="p-3 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}
          >
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.10] text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500/60 focus:bg-white/[0.09] placeholder:text-gray-600 transition-all"
                placeholder={`Message ${remoteDisplayName || ''}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shrink-0 transition-all"
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className="shrink-0 px-4 py-3 bg-black/80 backdrop-blur-xl border-t border-white/[0.07]">
        <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-lg mx-auto">

          <CtrlBtn onClick={toggleMute} active={isMuted} label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </CtrlBtn>

          <CtrlBtn onClick={toggleVideo} active={isVideoOff} label={isVideoOff ? 'Start Video' : 'Stop Video'}>
            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
          </CtrlBtn>

          <CtrlBtn
            onClick={toggleScreenShare}
            active={isScreenSharing}
            activeColor="bg-blue-500 shadow-blue-500/40"
            label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
          </CtrlBtn>

          <CtrlBtn
            onClick={toggleChat}
            active={isChatOpen}
            activeColor="bg-indigo-500 shadow-indigo-500/40"
            badge={!isChatOpen ? unreadCount : 0}
            label="Chat"
          >
            <MessageSquare size={18} />
          </CtrlBtn>

          {/* Divider */}
          <div className="w-px h-7 bg-white/10 hidden sm:block mx-1" />

          {/* End Call */}
          <CtrlBtn onClick={() => setShowEndConfirm(true)} danger label="End Session">
            <PhoneOff size={19} />
          </CtrlBtn>

        </div>
      </div>

      {/* ── End Call Confirmation Modal ── */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Red top accent */}
            <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600" />
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mb-4 mx-auto">
                <PhoneOff size={26} className="text-red-400" />
              </div>
              <h3 className="text-white text-lg font-bold text-center mb-1">End this session?</h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                {isConnected
                  ? `Your call with ${remoteDisplayName} will end. Duration: ${formatTime(callDuration)}`
                  : 'You will leave the room and return to Sessions.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-300 bg-white/[0.08] hover:bg-white/[0.13] rounded-xl transition-all border border-white/10"
                >
                  Stay in call
                </button>
                <button
                  onClick={endCall}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl transition-all shadow-lg shadow-red-600/30"
                >
                  End session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
