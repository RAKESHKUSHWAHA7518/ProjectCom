import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(name, email, password);
    const { user } = useAuthStore.getState();
    if (user) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    await useAuthStore.getState().googleLogin(credentialResponse.credential);
    const { user } = useAuthStore.getState();
    if (user) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-2xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">{t('Join the community today')}</h2>
        <p className="mt-2 text-center text-gray-500 dark:text-gray-400">{t('Create an Account')}</p>
        
        {error && <div className="p-3 mt-4 text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg">{error}</div>}
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Full Name')}</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Email Address')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Password')}</label>
              <input type="password" required minLength="6" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <button disabled={isLoading} type="submit" className="w-full px-4 py-2 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {isLoading ? t('Create Account') + '...' : t('Create Account')}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <span className="w-1/5 border-b border-gray-300 dark:border-gray-700 lg:w-1/4"></span>
          <span className="text-xs text-center text-gray-500 uppercase px-4 dark:text-gray-400">or sign up with</span>
          <span className="w-1/5 border-b border-gray-300 dark:border-gray-700 lg:w-1/4"></span>
        </div>
        
        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Login Failed');
            }}
          />
        </div>

        <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
          {t('Already have an account?')} <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500">{t('Sign in here')}</Link>
        </p>
      </div>
    </div>
  );
}
