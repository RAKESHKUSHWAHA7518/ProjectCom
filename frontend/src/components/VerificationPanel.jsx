import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVerificationStore } from '../store/verificationStore';
import { VerificationStatusCard } from './VerificationBadge';
import { AlertCircle, CheckCircle, XCircle, Loader2, Phone, Link2 as LinkedinIcon, BadgePercent, Video, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerificationPanel({ user, isOwnProfile }) {
  // eslint-disable-next-line no-unused-vars
  const { t } = useTranslation();
  // t is used in VerificationModals component via props
  const { verificationStatus, verificationRequests, fetchVerificationStatus, requestPhoneVerification, requestLinkedInVerification, requestIdentityVerification, requestVideoIntroVerification } = useVerificationStore();
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({});

  React.useEffect(() => {
    if (isOwnProfile && user?._id) {
      fetchVerificationStatus(user._id);
    }
  }, [isOwnProfile, user?._id, fetchVerificationStatus]);

  const handleRequestVerification = (type) => {
    setActiveModal(type);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      switch (activeModal) {
        case 'phone':
          result = await requestPhoneVerification(formData.phoneNumber);
          if (result?.code) {
            toast.success(`Verification code: ${result.code} (dev mode)`);
          } else {
            toast.success('Verification code sent to your phone');
          }
          break;
        case 'linkedin':
          result = await requestLinkedInVerification(formData.linkedinUrl);
          toast.success('LinkedIn verification request submitted');
          break;
        case 'identity':
          result = await requestIdentityVerification(formData);
          toast.success('Identity verification request submitted');
          break;
        case 'videoIntro':
          result = await requestVideoIntroVerification(formData.videoUrl);
          toast.success('Video intro verification request submitted');
          break;
      }
      setActiveModal(null);
      setFormData({});
    } catch {
      // Error handled by store
    }
  };

  if (!isOwnProfile) {
    return (
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          Verification Status
        </h3>
        <VerificationStatusCard
          verifications={verificationStatus}
          requests={verificationRequests}
        />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
        <VerificationStatusCard
          verifications={verificationStatus}
          requests={verificationRequests}
          onRequestVerification={handleRequestVerification}
        />
      </div>
      <VerificationModals
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        type={activeModal}
        onSubmit={handleSubmit}
        isLoading={false}
        formData={formData}
        setFormData={setFormData}
      />
    </>
  );
}

function VerificationModals({ isOpen, onClose, type, onSubmit, isLoading, formData, setFormData, t }) {
  if (!isOpen) return null;

  const modals = {
    phone: {
      title: 'Verify Phone Number',
      icon: Phone,
      fields: [
        { name: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 000-0000', required: true },
      ],
    },
    linkedin: {
      title: 'LinkedIn Verification',
      icon: LinkedinIcon,
      fields: [
        { name: 'linkedinUrl', label: 'LinkedIn Profile URL', type: 'url', placeholder: 'https://linkedin.com/in/yourprofile', required: true },
      ],
    },
    identity: {
      title: 'Identity Verification',
      icon: BadgePercent,
      fields: [
        { name: 'documentType', label: 'Document Type', type: 'select', options: ['passport', 'driverLicense', 'nationalId'], required: true },
        { name: 'documentNumber', label: 'Document Number', type: 'text', placeholder: 'A1234567', required: true },
        { name: 'documentFront', label: 'Document Front (URL)', type: 'url', placeholder: 'https://...', required: true },
        { name: 'documentBack', label: 'Document Back (URL)', type: 'url', placeholder: 'https://...', required: true },
        { name: 'selfie', label: 'Selfie with Document (URL)', type: 'url', placeholder: 'https://...', required: true },
      ],
    },
    videoIntro: {
      title: 'Video Intro Verification',
      icon: Video,
      fields: [
        { name: 'videoUrl', label: 'Video URL', type: 'url', placeholder: 'https://youtube.com/watch?v=... or https://vimeo.com/...', required: true },
      ],
    },
  };

  const config = modals[type];
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <config.icon className="w-8 h-8 text-primary-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t(config.title)}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {config.fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t(field.label)} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required={field.required}
                >
                  <option value="">{t('Select ' + field.label)}</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{t(opt)}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                  placeholder={t(field.placeholder)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}