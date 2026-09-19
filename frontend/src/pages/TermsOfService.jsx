import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

export default function TermsOfService() {
  const { t } = useTranslation();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <>
      <Helmet>
        <title>Terms of Service | SkillSwap</title>
        <meta name="description" content="SkillSwap Terms of Service" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Last updated: {lastUpdated}</p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              <section>
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing or using SkillSwap ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the Terms, you may not access the Service.</p>
              </section>

              <section>
                <h2>2. Description of Service</h2>
                <p>SkillSwap is a peer-to-peer skill exchange platform that connects users who want to teach skills with users who want to learn skills. Users exchange "skill credits" for sessions rather than monetary payment.</p>
              </section>

              <section>
                <h2>3. User Accounts</h2>
                <ul>
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for all activity under your account</li>
                </ul>
              </section>

              <section>
                <h2>4. Skill Credits System</h2>
                <ul>
                  <li>New users receive 10 free skill credits upon registration</li>
                  <li>Credits are deducted when booking sessions (1 credit per session)</li>
                  <li>Credits are earned by teaching sessions (1 credit per completed session)</li>
                  <li>Credits have no monetary value and cannot be purchased, sold, or transferred for cash</li>
                  <li>SkillSwap reserves the right to adjust credit balances for policy violations</li>
                </ul>
              </section>

              <section>
                <h2>5. Sessions and Conduct</h2>
                <ul>
                  <li>Sessions must be conducted respectfully and professionally</li>
                  <li>No harassment, discrimination, or inappropriate behavior</li>
                  <li>No sharing of illegal content, copyrighted material without permission, or harmful instructions</li>
                  <li>Sessions may be recorded only with explicit consent of all participants</li>
                  <li>No-shows or last-minute cancellations may result in credit forfeiture</li>
                </ul>
              </section>

              <section>
                <h2>6. Intellectual Property</h2>
                <p>You retain ownership of content you create and share. By sharing content on SkillSwap, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute that content in connection with the Service.</p>
              </section>

              <section>
                <h2>7. Disputes and Resolution</h2>
                <p>Disputes between users can be raised through our dispute system. SkillSwap administrators will review evidence and may issue resolutions including credit refunds, warnings, or account restrictions. Decisions are final.</p>
              </section>

              <section>
                <h2>8. Termination</h2>
                <p>We may suspend or terminate your account at any time for violations of these Terms, including but not limited to: fraudulent activity, harassment, spam, illegal activities, or repeated policy violations.</p>
              </section>

              <section>
                <h2>9. Disclaimer of Warranties</h2>
                <p>The Service is provided "as is" and "as available" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content or user on the platform.</p>
              </section>

              <section>
                <h2>10. Limitation of Liability</h2>
                <p>To the maximum extent permitted by law, SkillSwap shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or opportunities.</p>
              </section>

              <section>
                <h2>11. Changes to Terms</h2>
                <p>We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify users of material changes via email or in-app notification.</p>
              </section>

              <section>
                <h2>12. Governing Law</h2>
                <p>These Terms shall be governed by the laws of the jurisdiction where SkillSwap operates, without regard to conflict of law principles.</p>
              </section>

              <section>
                <h2>13. Contact</h2>
                <p>For questions about these Terms, contact us at <a href="mailto:legal@skillexchange.fun" className="text-primary-600 hover:underline">legal@skillexchange.fun</a>.</p>
              </section>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                By using SkillSwap, you acknowledge that you have read, understood, and agree to these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}