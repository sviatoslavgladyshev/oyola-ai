import React from 'react';
import { HiX } from 'react-icons/hi';

const Privacy = () => {
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
          <h1 className="policy-title-large">Privacy Policy</h1>
          <p className="policy-meta-text">Last updated: {lastUpdated}</p>

          <div className="policy-prose">
            <section className="policy-section">
              <h2 className="policy-heading">1. Introduction</h2>
              <p className="policy-text">
                Welcome to Oyola AI ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our real estate software services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">2. Information We Collect</h2>
              <h3 className="policy-subheading">2.1 Personal Information</h3>
              <p className="policy-text">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="policy-list">
                <li>Register for an account</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact us via email or contact forms</li>
                <li>Use our property search and analysis tools</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              <p className="policy-text">
                This information may include your name, email address, phone number, mailing address, and any other information you choose to provide.
              </p>

              <h3 className="policy-subheading">2.2 Property Search Data</h3>
              <p className="policy-text">
                When you use our property search features, we may collect information about:
              </p>
              <ul className="policy-list">
                <li>Search criteria and preferences</li>
                <li>Saved properties and favorites</li>
                <li>ROI calculations and investment analysis</li>
                <li>Location preferences</li>
              </ul>

              <h3 className="policy-subheading">2.3 Automatically Collected Information</h3>
              <p className="policy-text">
                We automatically collect certain information when you visit our website, including:
              </p>
              <ul className="policy-list">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">3. How We Use Your Information</h2>
              <p className="policy-text">
                We use the information we collect to:
              </p>
              <ul className="policy-list">
                <li>Provide, maintain, and improve our real estate software services</li>
                <li>Process your transactions and send related information</li>
                <li>Send you property alerts and updates based on your preferences</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">4. Information Sharing and Disclosure</h2>
              <p className="policy-text">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="policy-list">
                <li><strong>Service Providers:</strong> With third-party service providers who perform services on our behalf</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you have given us explicit permission to share your information</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">5. Data Security</h2>
              <p className="policy-text">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">6. Your Rights</h2>
              <p className="policy-text">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="policy-list">
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate information</li>
                <li>The right to delete your personal information</li>
                <li>The right to restrict or object to processing</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p className="policy-text">
                To exercise these rights, please contact us at <a href="mailto:oyola.ai.inc@gmail.com" className="policy-link">oyola.ai.inc@gmail.com</a>.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">7. Cookies and Tracking Technologies</h2>
              <p className="policy-text">
                We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">8. Children's Privacy</h2>
              <p className="policy-text">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">9. Changes to This Privacy Policy</h2>
              <p className="policy-text">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="policy-section">
              <h2 className="policy-heading">10. Contact Us</h2>
              <p className="policy-text">
                If you have any questions about this Privacy Policy, please contact us:
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

export default Privacy;
