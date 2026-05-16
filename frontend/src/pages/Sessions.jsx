import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import Avatar from '../components/Avatar';
import { Calendar, Clock, Video, CheckCircle, XCircle, AlertCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function Sessions() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { sessions, fetchSessions, updateSessionStatus, addSessionNote, isLoading } = useSessionStore();
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'pending'
  const [activeNoteSession, setActiveNoteSession] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await updateSessionStatus(sessionId, status);
      toast.success(`Session ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddNote = async (sessionId) => {
    if (!noteContent.trim()) return;
    try {
      await addSessionNote(sessionId, noteContent, []);
      toast.success('Note added');
      setNoteContent('');
      setActiveNoteSession(null);
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  const filteredSessions = sessions.filter(s => {
    const isPast = new Date(s.scheduledAt) < new Date();
    if (filter === 'upcoming') return !isPast && (s.status === 'accepted' || s.status === 'pending');
    if (filter === 'past') return isPast || s.status === 'completed' || s.status === 'cancelled';
    if (filter === 'pending') return s.status === 'pending';
    return true;
  });

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Your Sessions')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('Manage your learning')}</p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['upcoming', 'pending', 'past'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t(f)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {filter === 'upcoming' ? t('No upcoming sessions') : filter === 'pending' ? t('No pending sessions') : t('No past sessions')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {filter === 'upcoming' ? t("You don't have any sessions scheduled yet.") : t("No session history found.")}
          </p>
          <button
            onClick={() => navigate('/explore')}
            className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20"
          >
            {t('Find a Mentor')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSessions.map((session) => {
            const isMentor = session.mentor?._id === user._id;
            const other = isMentor ? session.learner : session.mentor;
            const sessionDate = new Date(session.scheduledAt);

            return (
              <div key={session._id} className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar src={other?.avatar} name={other?.name} size="lg" className="rounded-2xl" />
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1 inline-block ${
                        isMentor ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {isMentor ? t('Mentoring') : t('Learning')}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{other?.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{session.skill?.name}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    session.status === 'accepted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                    session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                    session.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30'
                  }`}>
                    {session.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Date')}</p>
                      <p className="text-sm font-semibold dark:text-white">{sessionDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{t('Time')}</p>
                      <p className="text-sm font-semibold dark:text-white">{sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>

                {session.notes && (
                  <div className="mb-6 p-4 bg-primary-50/50 dark:bg-primary-950/10 rounded-2xl border border-primary-100/50 dark:border-primary-900/20">
                    <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase mb-1">{t('Session Goals')}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{session.notes}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  {session.status === 'pending' && isMentor ? (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(session._id, 'accepted')}
                        className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> {t('Accept')}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(session._id, 'cancelled')}
                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-red-600 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> {t('Decline')}
                      </button>
                    </>
                  ) : session.status === 'accepted' ? (
                    <>
                      <button
                        onClick={() => navigate(`/video/${session._id}`)}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <Video className="w-4 h-4" /> {t('Join Room')}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(session._id, 'completed')}
                        className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 rounded-xl hover:bg-emerald-200 transition"
                        title="Mark as Complete"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate('/chat')}
                      className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" /> {t('Send Message')}
                    </button>
                  )}
                </div>

                {/* Shared Notes Section */}
                {(session.status === 'completed' || session.status === 'accepted') && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t('Shared Notes & Resources')}</h4>
                    
                    {session.sharedNotes && session.sharedNotes.length > 0 && (
                      <div className="space-y-4 mb-4">
                        {session.sharedNotes.map((note, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar src={note.user?.avatar} name={note.user?.name} size="sm" />
                              <span className="text-xs font-semibold dark:text-white">{note.user?.name}</span>
                              <span className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeNoteSession === session._id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          autoFocus
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder={t('Type your notes')}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                          rows="3"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setActiveNoteSession(null); setNoteContent(''); }}
                            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {t('Cancel')}
                          </button>
                          <button
                            onClick={() => handleAddNote(session._id)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                          >
                            {t('Save Note')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveNoteSession(session._id)}
                        className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
                      >
                        {t('+ Add Session Note')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
