import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useReviewStore } from '../store/reviewStore';
import { useChatStore } from '../store/chatStore';
import { MapPin, Star, Edit3, MessageCircle, Trophy, Medal, Target, Flame, Gem, Crown, Rocket, Camera, Upload, Trash2, Zap, Mail, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import VerificationPanel from '../components/VerificationPanel';
import { useTranslation } from 'react-i18next';

const ICON_MAP = { Star, Target, Flame, Gem, Crown, Rocket, Trophy, Medal };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Profile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { reviews, fetchReviews } = useReviewStore();
  const { getOrCreateConversation } = useChatStore();
  const isOwnProfile = !id || id === currentUser?._id;

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isOwnProfile) {
        const res = await fetch(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        const data = await res.json();
        setProfile(data);
        setEditData({ name: data.name, bio: data.bio, location: data.location, timezone: data.timezone, avatar: data.avatar, socialLinks: data.socialLinks || {} });

        const skillsRes = await fetch(`${API_URL}/skills`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        setSkills(await skillsRes.json());
        fetchReviews(currentUser._id);
      } else {
        const res = await fetch(`${API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        const data = await res.json();
        setProfile(data.user);
        setSkills(data.skills || []);
        fetchReviews(id);
      }
    } catch {
      console.error('Failed to load profile');
    }
    setIsLoading(false);
  }, [id, isOwnProfile, currentUser, fetchReviews]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setIsEditing(false);
      }
    } catch {
      console.error('Failed to save profile');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile, avatar: data.avatar });
        // Also update the auth store if needed
        toast.success('Avatar updated!');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch {
      toast.error('Failed to upload image');
    }
  };

  const handleStartChat = async () => {
    try {
      if (!profile || !profile._id) return;
      const conv = await getOrCreateConversation(profile._id);
      navigate(`/chat/${conv._id}`);
    } catch {
      alert('Failed to start conversation');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone and will permanently erase all your data.")) {
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        if (res.ok) {
          useAuthStore.getState().logout();
          navigate('/login');
          toast.success("Account deleted successfully");
        } else {
          const data = await res.json();
          toast.error(data.message || "Failed to delete account");
        }
      } catch {
        toast.error("Failed to delete account");
      }
    }
  };

  const getCompletenessScore = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name) score += 20;
    if (profile.bio) score += 20;
    if (profile.location) score += 15;
    if (skills.filter(s => s.type === 'teach').length > 0) score += 20;
    if (skills.filter(s => s.type === 'learn').length > 0) score += 15;
    if (profile.avatar) score += 10;
    return score;
  };

  if (isLoading) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <div className="relative p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-pulse">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gray-200 dark:bg-gray-800" />
          <div className="relative flex flex-col md:flex-row items-start gap-6 pt-16">
            <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-2xl shrink-0" />
            <div className="flex-1 w-full space-y-3 mt-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/5" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-400">User not found</div>;
  }

  const handleEndorse = async (skillId) => {
    try {
      const res = await fetch(`${API_URL}/skills/${skillId}/endorse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        const newEndorsements = await res.json();
        setSkills(skills.map(s => s._id === skillId ? { ...s, endorsements: newEndorsements } : s));
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to endorse skill');
      }
    } catch {
      toast.error('Failed to endorse skill');
    }
  };

  const completeness = getCompletenessScore();

  return (
    <div className="py-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="relative p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500" />

        <div className="relative flex flex-col md:flex-row items-start gap-6 pt-16">
          <div className="relative group/avatar">
            <Avatar src={profile.avatar} name={profile.name} size="xl" className="border-4 border-white dark:border-gray-900 shadow-xl" />
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                {profile.email && <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><Mail className="w-3.5 h-3.5" /> {profile.email}</p>}
                {profile.location && <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {profile.location}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(profile.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{profile.rating?.toFixed(1) || '0.0'} ({profile.numReviews || 0} {t('reviews')})</span>
                </div>
              </div>
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="self-start sm:self-auto px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" /> {isEditing ? t('Cancel') : t('Edit Profile')}
                </button>
              ) : (
                <button
                  onClick={handleStartChat}
                  className="self-start sm:self-auto px-6 py-2 text-sm font-medium bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> {t('Message')}
                </button>
              )}
            </div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">{profile.bio || t('No bio yet')}</p>
            {profile.socialLinks && (profile.socialLinks.github || profile.socialLinks.linkedin || profile.socialLinks.website) && (
              <div className="flex items-center gap-4 mt-3">
                {profile.socialLinks.github && (
                  <a href={profile.socialLinks.github.startsWith('http') ? profile.socialLinks.github : `https://${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin.startsWith('http') ? profile.socialLinks.linkedin : `https://${profile.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                  </a>
                )}
                {profile.socialLinks.website && (
                  <a href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{profile.skillCredits || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Credits')}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{profile.totalSessionsAsMentor || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Sessions Taught')}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{profile.totalSessionsAsLearner || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Sessions Learned')}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.streak?.current || 0}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Day Streak')}</div>
          </div>
        </div>

        {/* Profile Completeness */}
        {isOwnProfile && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl group relative">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                {t('Profile Completeness')}
                {completeness < 100 && (
                  <span className="text-xs font-normal text-gray-500">{t('Hover for tips')}</span>
                )}
              </span>
              <span className="font-bold text-primary-600 dark:text-primary-400">{completeness}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            {completeness < 100 && (
              <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs">
                <p className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{t('To reach 100%')}</p>
                <ul className="list-disc pl-4 space-y-1 text-gray-600 dark:text-gray-400">
                  {!profile.name && <li>{t('Add your name')}</li>}
                  {!profile.bio && <li>{t('Add a short bio')}</li>}
                  {!profile.location && <li>{t('Add your location')}</li>}
                  {!profile.avatar && <li>{t('Upload an avatar')}</li>}
                  {skills.filter(s => s.type === 'teach').length === 0 && <li>{t('Add skills you can teach')}</li>}
                  {skills.filter(s => s.type === 'learn').length === 0 && <li>{t('Add skills you want to learn')}</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="mt-6 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('Edit Profile')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Name')}</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Location')}</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder={t('City, Country')} value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Bio')}</label>
              <textarea className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" rows="3" placeholder={t('Tell the community about yourself...')} value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('GitHub URL')}</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="https://github.com/username" value={editData.socialLinks?.github || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, github: e.target.value } })} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('LinkedIn URL')}</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="https://linkedin.com/in/username" value={editData.socialLinks?.linkedin || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, linkedin: e.target.value } })} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Portfolio URL')}</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="https://yourwebsite.com" value={editData.socialLinks?.website || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, website: e.target.value } })} />
            </div>
          </div>
          <button onClick={handleSave} className="mt-4 px-6 py-2.5 text-white font-medium bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition">
            {t('Save Changes')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Skills */}
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('Skills')}</h2>
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('Teaching')}</h4>
            <div className="flex flex-wrap gap-2">
              {skills.filter(s => s.type === 'teach').map(s => {
                const isEndorsed = s.endorsements?.includes(currentUser?._id);
                const count = s.endorsements?.length || 0;
                return (
                  <div key={s._id} className="flex items-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800 pr-1">
                    <span className="px-3 py-1.5 text-sm font-medium">
                      {s.name} • {s.proficiencyLevel}
                    </span>
                    {!isOwnProfile && (
                      <button 
                        onClick={() => handleEndorse(s._id)} 
                        className={`ml-1 px-2 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${isEndorsed ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-800'}`}
                        title={isEndorsed ? "Remove endorsement" : "Endorse skill"}
                      >
                        <Zap className="w-3 h-3" /> {count > 0 ? count : ''}
                      </button>
                    )}
                    {isOwnProfile && count > 0 && (
                      <span className="ml-1 px-2 py-1 rounded-md text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 flex items-center gap-1" title={`${count} endorsements`}>
                        <Zap className="w-3 h-3" /> {count}
                      </span>
                    )}
                  </div>
                );
              })}
              {skills.filter(s => s.type === 'teach').length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">{t('No teaching skills')}</p>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('Learning')}</h4>
            <div className="flex flex-wrap gap-2">
              {skills.filter(s => s.type === 'learn').map(s => (
                <span key={s._id} className="px-3 py-1.5 text-sm font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  {s.name} • {s.proficiencyLevel}
                </span>
              ))}
              {skills.filter(s => s.type === 'learn').length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">{t('No learning skills')}</p>}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('Badges & Achievements')}</h2>
          {profile.badges && profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {profile.badges.map((badge, i) => {
                const BadgeIcon = ICON_MAP[badge.icon] || Trophy;
                const isEmoji = badge.icon && !ICON_MAP[badge.icon];
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-100 dark:border-amber-800 rounded-xl">
                    {isEmoji ? (
                      <span className="text-2xl">{badge.icon}</span>
                    ) : (
                      <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg text-amber-600 dark:text-amber-500 shrink-0">
                        <BadgeIcon className="w-5 h-5" strokeWidth={2} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{badge.label || badge.type}</p>
                      {badge.earnedAt && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(badge.earnedAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
              <Medal className="w-12 h-12 mb-2 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
              <p className="text-sm">{t('No badges earned')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-6 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('Reviews')} ({reviews.length})</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-sm">
                      {review.reviewer?.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{review.reviewer?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">{t('No reviews yet')}</p>
        )}
      </div>

      {/* Verification Panel */}
      {isOwnProfile && (
        <VerificationPanel user={profile} isOwnProfile={true} />
      )}

      {/* Danger Zone */}
      {isOwnProfile && (
        <div className="mt-6 p-6 bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900/30 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('Danger Zone')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('Danger Text')}
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> {t('Delete Account')}
          </button>
        </div>
      )}
    </div>
  );
}
