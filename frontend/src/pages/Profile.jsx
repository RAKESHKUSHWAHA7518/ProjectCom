import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useReviewStore } from '../store/reviewStore';

const API_URL = 'http://localhost:5000/api';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const { reviews, fetchReviews } = useReviewStore();
  const isOwnProfile = !id || id === currentUser?._id;

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      if (isOwnProfile) {
        // Fetch own profile
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
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

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
    } catch (err) {
      console.error(err);
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="py-20 text-center text-gray-500">User not found</div>;
  }

  const completeness = getCompletenessScore();

  return (
    <div className="py-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="relative p-8 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500" />

        <div className="relative flex flex-col md:flex-row items-start gap-6 pt-16">
          <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold text-primary-600 shrink-0 overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.name?.charAt(0)
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {profile.location && <p className="text-gray-500 flex items-center gap-1 mt-1">📍 {profile.location}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-yellow-500 text-lg">{'⭐'.repeat(Math.round(profile.rating || 0))}</span>
                  <span className="text-sm text-gray-500">{profile.rating?.toFixed(1) || '0.0'} ({profile.numReviews || 0} reviews)</span>
                </div>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  {isEditing ? 'Cancel' : '✏️ Edit Profile'}
                </button>
              )}
            </div>
            <p className="mt-3 text-gray-600">{profile.bio || 'No bio yet.'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-primary-600">{profile.skillCredits || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Credits</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-600">{profile.totalSessionsAsMentor || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Sessions Taught</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-orange-600">{profile.totalSessionsAsLearner || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Sessions Learned</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">{profile.streak?.current || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
          </div>
        </div>

        {/* Profile Completeness */}
        {isOwnProfile && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Profile Completeness</span>
              <span className="font-bold text-primary-600">{completeness}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="mt-6 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Location</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50" placeholder="City, Country" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">Bio</label>
              <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50" rows="3" placeholder="Tell the community about yourself..." value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">GitHub URL</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50" placeholder="https://github.com/username" value={editData.socialLinks?.github || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, github: e.target.value } })} />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">LinkedIn URL</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50" placeholder="https://linkedin.com/in/username" value={editData.socialLinks?.linkedin || ''} onChange={(e) => setEditData({ ...editData, socialLinks: { ...editData.socialLinks, linkedin: e.target.value } })} />
            </div>
          </div>
          <button onClick={handleSave} className="mt-4 px-6 py-2.5 text-white font-medium bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl hover:shadow-lg transition">
            Save Changes
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Skills */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Skills</h2>
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Teaching</h4>
            <div className="flex flex-wrap gap-2">
              {skills.filter(s => s.type === 'teach').map(s => (
                <span key={s._id} className="px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  {s.name} • {s.proficiencyLevel}
                </span>
              ))}
              {skills.filter(s => s.type === 'teach').length === 0 && <p className="text-sm text-gray-400">No teaching skills added yet</p>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Learning</h4>
            <div className="flex flex-wrap gap-2">
              {skills.filter(s => s.type === 'learn').map(s => (
                <span key={s._id} className="px-3 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  {s.name} • {s.proficiencyLevel}
                </span>
              ))}
              {skills.filter(s => s.type === 'learn').length === 0 && <p className="text-sm text-gray-400">No learning skills added yet</p>}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Badges & Achievements</h2>
          {profile.badges && profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {profile.badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl">
                  <span className="text-2xl">{badge.icon || '🏆'}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{badge.label || badge.type}</p>
                    <p className="text-xs text-gray-500">{badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🏅</div>
              <p className="text-sm">No badges earned yet. Complete sessions to earn badges!</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-6 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {review.reviewer?.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{review.reviewer?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">No reviews yet</p>
        )}
      </div>
    </div>
  );
}
