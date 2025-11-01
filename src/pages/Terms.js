import React from 'react';

const Terms = () => {
  return (
    <div className="container-single policy-page">
      <div className="offer-form-card policy-card">
        <div className="policy-back">
          <button
            className="link-button policy-back-button"
            onClick={() => {
              window.history.back();
            }}
          >
            <svg
              className="policy-back-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
        <h2 className="policy-title">Terms of Service</h2>
        <p className="policy-meta">Effective date: October 30, 2025</p>
        <p>These Terms govern your access to and use of the Oyola AI platform. By using the Service, you agree to be bound by these Terms.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>1. Use of the Service</h3>
        <ul className="policy-list">
          <li>You must be at least 18 and able to form a binding contract.</li>
          <li>Provide accurate information and keep your account secure.</li>
          <li>You are responsible for activity under your account.</li>
        </ul>
        <h3 className="section-title" style={{ marginTop: 24 }}>2. Offers and Content</h3>
        <ul className="policy-list">
          <li>You retain ownership of content you submit. You grant us a license to use and process it to provide and improve the Service.</li>
          <li>You are responsible for ensuring submissions are lawful and non-infringing.</li>
        </ul>
        <h3 className="section-title" style={{ marginTop: 24 }}>3. Acceptable Use</h3>
        <ul className="policy-list">
          <li>No misuse, interference, or unauthorized access methods.</li>
          <li>No reverse engineering, scraping without consent, or security circumvention.</li>
        </ul>
        <h3 className="section-title" style={{ marginTop: 24 }}>4. Privacy</h3>
        <p>Your use is subject to our <a className="footer-link" href="/privacy.html">Privacy Policy</a>.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>5. Intellectual Property</h3>
        <p>The Service’s software, design, and branding are owned by or licensed to Oyola AI. These Terms grant no rights to our trademarks or logos.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>6. Third-Party Services</h3>
        <p>We may integrate third-party services. Their terms may apply.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>7. Disclaimers</h3>
        <p>The Service is provided “AS IS” and “AS AVAILABLE”. We disclaim all warranties to the fullest extent permitted by law.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>8. Limitation of Liability</h3>
        <p>To the maximum extent permitted by law, Oyola AI will not be liable for indirect or consequential damages or lost profits, data, or goodwill.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>9. Suspension and Termination</h3>
        <p>We may suspend or terminate access for violations or investigations of suspected misconduct.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>10. Changes</h3>
        <p>We may update the Service and these Terms. Continued use constitutes acceptance.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>11. Governing Law</h3>
        <p>Governed by applicable laws in your residence unless otherwise required by law.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>12. Contact</h3>
        <p>Contact <a className="footer-link" href="mailto:support@oyola.ai">support@oyola.ai</a> for questions.</p>
      </div>
    </div>
  );
};

export default Terms;


