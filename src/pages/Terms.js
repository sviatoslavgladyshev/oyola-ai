import React from 'react';
import { HiX } from 'react-icons/hi';

const Terms = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleClose = () => {
    window.location.href = '/';
  };

  return (
    <main className="policy-main">
      <div className="policy-container">
        <button 
          className="policy-close-button"
          onClick={handleClose}
          aria-label="Close"
          title="Close"
        >
          <HiX size={24} />
        </button>
        <div className="policy-content">
          <h1 className="policy-title-large">Terms of Use</h1>
          <p className="policy-meta-text">Last updated: {lastUpdated}</p>

          <div className="policy-prose">
            <section className="policy-section">
              <h2 className="policy-heading">1. Agreement to Terms</h2>
              <p className="policy-text">
                By accessing or using the Oyola AI website and services ("Service"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of these Terms, you may not access the Service.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">2. Description of Service</h2>
              <p className="policy-text">
                Oyola AI provides real estate software services that help users find and analyze income-generating properties. Our services include:
              </p>
              <ul className="policy-list">
                <li>Property search and filtering tools</li>
                <li>ROI and rental yield calculators</li>
                <li>Market analytics and property insights</li>
                <li>Investment portfolio tracking</li>
                <li>Location intelligence and neighborhood data</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">3. User Accounts</h2>
              <p className="policy-text">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:
              </p>
              <ul className="policy-list">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">4. Acceptable Use</h2>
              <p className="policy-text">
                You agree not to use the Service:
              </p>
              <ul className="policy-list">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any malicious code, viruses, or harmful data</li>
                <li>To attempt to gain unauthorized access to the Service or related systems</li>
                <li>To interfere with or disrupt the Service or servers</li>
                <li>To impersonate any person or entity</li>
                <li>To collect or store personal data about other users</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">5. Property Data and Information</h2>
              <p className="policy-text">
                The property data, market information, and analytics provided through our Service are for informational and analytical purposes only. While we strive to provide accurate information:
              </p>
              <ul className="policy-list">
                <li>We do not guarantee the accuracy, completeness, or timeliness of any property data</li>
                <li>Property information may change without notice</li>
                <li>ROI calculations and projections are estimates and not financial advice</li>
                <li>You should verify all property information independently before making investment decisions</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">6. No Investment Advice</h2>
              <p className="policy-text">
                <strong>Important:</strong> Oyola AI does not provide financial, investment, or legal advice. The information and tools provided are for analytical purposes only and should not be considered as:
              </p>
              <ul className="policy-list">
                <li>Recommendations to buy, sell, or invest in any property</li>
                <li>Professional financial or investment advice</li>
                <li>Substitute for consultation with qualified professionals</li>
              </ul>
              <p className="policy-text">
                Always consult with qualified financial advisors, real estate professionals, and attorneys before making investment decisions.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">7. Intellectual Property</h2>
              <p className="policy-text">
                The Service and its original content, features, and functionality are owned by Oyola AI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not:
              </p>
              <ul className="policy-list">
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Use our trademarks or logos without written consent</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">8. Third-Party Services</h2>
              <p className="policy-text">
                Our Service may contain links to third-party websites or services that are not owned or controlled by Oyola AI. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party services. You acknowledge and agree that Oyola AI shall not be responsible or liable for any damage or loss caused by the use of any third-party services.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">9. Limitation of Liability</h2>
              <p className="policy-text">
                To the maximum extent permitted by law, Oyola AI and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
              </p>
              <ul className="policy-list">
                <li>Your use or inability to use the Service</li>
                <li>Any property investment decisions made based on information from our Service</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Any other matter relating to the Service</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">10. Disclaimer of Warranties</h2>
              <p className="policy-text">
                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to:
              </p>
              <ul className="policy-list">
                <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the accuracy or reliability of any information obtained through the Service</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">11. Indemnification</h2>
              <p className="policy-text">
                You agree to defend, indemnify, and hold harmless Oyola AI and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with:
              </p>
              <ul className="policy-list">
                <li>Your access to or use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party right</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">12. Termination</h2>
              <p className="policy-text">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">13. Changes to Terms</h2>
              <p className="policy-text">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">14. Governing Law</h2>
              <p className="policy-text">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Oyola AI operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">15. Contact Information</h2>
              <p className="policy-text">
                If you have any questions about these Terms of Use, please contact us:
              </p>
              <p className="policy-text">
                <strong>Email:</strong> <a href="mailto:oyola.ai.inc@gmail.com" className="policy-link">oyola.ai.inc@gmail.com</a>
              </p>
            </section>
          </div>

          <div className="policy-footer">
            <a href="/" className="policy-back-link">← Back to Home</a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Terms;
