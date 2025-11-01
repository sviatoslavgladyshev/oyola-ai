import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <span>© {year} Oyola AI. All rights reserved.</span>
        </div>
        <nav className="footer-nav">
          <a href="/privacy" className="footer-link">Privacy Policy</a>
          <span className="footer-sep">•</span>
          <a href="/terms" className="footer-link">Terms of Service</a>
          <span className="footer-sep">•</span>
          <a href="mailto:support@oyola.ai" className="footer-link">Contact</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;


