import React from 'react';

const Privacy = () => {
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
        <h2 className="policy-title">Privacy Policy</h2>
        <p className="policy-meta">Effective date: October 30, 2025</p>
        <p>Oyola AI ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights and choices.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>Information We Collect</h3>
        <ul className="policy-list">
          <li><strong>Account information</strong>: name, email, profile image, and authentication identifiers.</li>
          <li><strong>Usage data</strong>: interactions, device/browser details, approximate location selections.</li>
          <li><strong>Offer data</strong>: property preferences and offer details you submit.</li>
          <li><strong>Cookies</strong>: for sessions and UX improvements.</li>
        </ul>
        <h3 className="section-title" style={{ marginTop: 24 }}>How We Use Information</h3>
        <ul className="policy-list">
          <li>Provide, operate, and improve the platform.</li>
          <li>Authenticate users and personalize experience.</li>
          <li>Process offers and deliver notifications.</li>
          <li>Security, abuse prevention, analytics, and legal compliance.</li>
        </ul>
        <h3 className="section-title" style={{ marginTop: 24 }}>Sharing of Information</h3>
        <p>We do not sell your personal information. We may share with service providers, at your direction, or for legal/safety reasons.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>Data Retention</h3>
        <p>We retain personal information as needed to provide the service and comply with legal obligations. You may request deletion.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>Your Rights and Choices</h3>
        <ul className="policy-list">
          <li>Access, update, or delete account data.</li>
          <li>Opt out of non-essential communications.</li>
          <li>Disable cookies (may affect functionality).</li>
          <li>Request a copy or deletion via support.</li>
        </ul>
        <h3 className="section-title" style={{ marginTop: 24 }}>Security</h3>
        <p>We use reasonable safeguards to protect information. No method is 100% secure.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>International Transfers</h3>
        <p>Your information may be processed where our providers operate. We take steps to protect it.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>Children’s Privacy</h3>
        <p>Our services are not directed to children under 13, and we do not knowingly collect data from children.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>Changes</h3>
        <p>We may update this policy. The effective date will be updated accordingly.</p>
        <h3 className="section-title" style={{ marginTop: 24 }}>Contact</h3>
        <p>Contact <a className="footer-link" href="mailto:support@oyola.ai">support@oyola.ai</a> for questions or requests.</p>
      </div>
    </div>
  );
};

export default Privacy;


