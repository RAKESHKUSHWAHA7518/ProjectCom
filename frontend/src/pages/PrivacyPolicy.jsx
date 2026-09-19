import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <>
      <Helmet>
        <title>Privacy Policy | SkillSwap</title>
        <meta name="description" content="SkillSwap Privacy Policy" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Last updated: {lastUpdated}</p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              <section>
                <h2>1. Information We Collect</h2>
                <h3>Account Information</h3>
                <ul>
                  <li>Name, email address, password (hashed)</li>
                  <li>Profile data: bio, location, timezone, avatar, social links</li>
                  <li>Skills you teach and want to learn</li>
                  <li>Availability schedule</li>
                </ul>
                <h3>Session Data</h3>
                <ul>
                  <li>Session history: dates, duration, participants, skills</li>
                  <li>Messages exchanged during sessions</li>
                  <li>Shared notes and resources</li>
                  <li>Reviews and ratings given/received</li>
                </ul>
                <h3>Technical Data</h3>
                <ul>
                  <li>IP address, browser type, device information</li>
                  <li>Usage analytics: pages visited, features used, time spent</li>
                  <li>Error logs and performance metrics</li>
                </ul>
                <h3>Communication Data</h3>
                <ul>
                  <li>Chat messages between users</li>
                  <li>Notifications and emails sent</li>
                  <li>Support correspondence</li>
                </ul>
              </section>

              <section>
                <h2>2. How We Use Your Information</h2>
                <ul>
                  <li>Provide and maintain the Service</li>
                  <li>Match mentors with learners</li>
                  <li>Facilitate sessions and communications</li>
                  <li>Process skill credit transactions</li>
                  <li>Send session reminders and notifications</li>
                  <li>Improve and personalize the Service</li>
                  <li>Ensure safety and prevent abuse</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2>3. Information Sharing</h2>
                <p>We do not sell your personal information. We may share data:</p>
                <ul>
                  <li><strong>With other users:</strong> Profile info, skills, ratings, session history (as needed for the Service)</li>
                  <li><strong>With service providers:</strong> Cloud hosting (MongoDB Atlas), email (Resend), error tracking (Sentry), image storage (Cloudinary) — under strict data processing agreements</li>
                  <li><strong>Legal requirements:</strong> When required by law, court order, or to protect rights/safety</li>
                  <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section>
                <h2>4. Data Retention</h2>
                <ul>
                  <li>Account data: Retained while account is active</li>
                  <li>Session history: Retained for 7 years for dispute resolution</li>
                  <li>Messages: Retained while account is active</li>
                  <li>Analytics data: Aggregated/anonymized after 2 years</li>
                  <li>Deleted account data: Purged within 30 days (except legal holds)</li>
                </ul>
              </section>

              <section>
                <h2>5. Your Rights (GDPR/CCPA)</h2>
                <p>Depending on your location, you may have the right to:</p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate data</li>
                  <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Restriction:</strong> Limit processing of your data</li>
                  <li><strong>Objection:</strong> Object to certain processing (e.g., marketing)</li>
                  <li><strong>Withdraw consent:</strong> Where processing is based on consent</li>
                </ul>
                <p>To exercise these rights, email <a href="mailto:privacy@skillexchange.fun" className="text-primary-600 hover:underline">privacy@skillexchange.fun</a> or use the "Download My Data" / "Delete Account" features in settings.</p>
              </section>

              <section>
                <h2>6. Cookies and Tracking</h2>
                <ul>
                  <li><strong>Essential cookies:</strong> Authentication, session management, CSRF protection</li>
                  <li><strong>Preference cookies:</strong> Theme, language, notification settings</li>
                  <li><strong>Analytics cookies:</strong> Anonymous usage statistics (with consent)</li>
                  <li>You can manage cookie preferences via the cookie banner or browser settings</li>
                </ul>
              </section>

              <section>
                <h2>7. Security</h2>
                <ul>
                  <li>Passwords hashed with bcrypt (cost factor 10)</li>
                  <li>JWT tokens for authentication (short-lived access + refresh tokens)</li>
                  <li>HTTPS/TLS encryption for all traffic</li>
                  <li>Rate limiting and abuse detection</li>
                  <li>Regular security audits and dependency scanning</li>
                </ul>
              </section>

              <section>
                <h2>8. International Transfers</h2>
                <p>Your data may be processed on servers located in the United States and other countries. We ensure appropriate safeguards (Standard Contractual Clauses, adequacy decisions) for international transfers.</p>
              </section>

              <section>
                <h2>9. Children's Privacy</h2>
                <p>SkillSwap is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, contact us immediately.</p>
              </section>

              <section>
                <h2>10. Changes to This Policy</h2>
                <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification. Continued use constitutes acceptance.</p>
              </section>

              <section>
                <h2>11. Contact</h2>
                <p>For privacy questions or to exercise your rights, contact our Data Protection Officer at <a href="mailto:privacy@skillexchange.fun" className="text-primary-600 hover:underline">privacy@skillexchange.fun</a>.</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}