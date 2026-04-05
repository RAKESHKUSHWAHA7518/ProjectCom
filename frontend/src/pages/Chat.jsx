import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { connectSocket, getSocket } from '../utils/socket';

export default function Chat() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    currentMessages,
    activeConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    addMessage,
    setActiveConversation,
  } = useChatStore();

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    const socket = connectSocket(user._id);

    socket.on('new-message', (data) => {
      if (data.conversationId === conversationId) {
        addMessage(data);
      }
      fetchConversations(); // Refresh conversation list
    });

    socket.on('user-typing', (data) => {
      setTypingUser(data.userName);
    });

    socket.on('user-stop-typing', () => {
      setTypingUser('');
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      const conv = conversations.find((c) => c._id === conversationId);
      if (conv) setActiveConversation(conv);

      const socket = getSocket();
      socket.emit('join-conversation', conversationId);

      return () => {
        socket.emit('leave-conversation', conversationId);
      };
    }
  }, [conversationId, conversations.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    const socket = getSocket();
    const otherParticipant = activeConversation?.participants?.find(
      (p) => p._id !== user._id
    );

    try {
      const msg = await sendMessage(conversationId, newMessage.trim());
      socket.emit('send-message', {
        ...msg,
        conversationId,
        recipientId: otherParticipant?._id,
      });
      socket.emit('stop-typing', { conversationId, userId: user._id });
      setNewMessage('');
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const socket = getSocket();
    socket.emit('typing', { conversationId, userId: user._id, userName: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { conversationId, userId: user._id });
    }, 2000);
  };

  const getOtherUser = (conv) => {
    return conv.participants?.find((p) => p._id !== user._id);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Sidebar - Conversation List */}
      <div className={`${conversationId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white border-r border-gray-100`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">No conversations yet. Message someone from Explore!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherUser(conv);
              const isActive = conv._id === conversationId;
              return (
                <button
                  key={conv._id}
                  onClick={() => navigate(`/chat/${conv._id}`)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition border-b border-gray-50 ${
                    isActive ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    {other?.avatar ? <img src={other.avatar} className="w-full h-full rounded-full object-cover" /> : other?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{other?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {conversationId && activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100 shadow-sm">
              <button onClick={() => navigate('/chat')} className="md:hidden text-gray-500 hover:text-gray-700 mr-2">
                ← Back
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                {getOtherUser(activeConversation)?.name?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{getOtherUser(activeConversation)?.name || 'Unknown'}</h3>
                {typingUser && <p className="text-xs text-primary-500 animate-pulse">{typingUser} is typing...</p>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentMessages.map((msg, i) => {
                const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                return (
                  <div key={msg._id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-md'
                          : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-md'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 text-white font-medium bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-700">Select a conversation</h3>
              <p className="text-gray-500 mt-2">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
