import React from 'react';

const Footer = ({ transparent = false }) => {
  const year = new Date().getFullYear();
  return (
    <footer className={`app-footer${transparent ? ' transparent' : ''}`}>
      <div className="footer-content">
        <div className="footer-left footer-pill">
          <span>© {year} Oyola AI. All rights reserved.</span>
        </div>
        <nav className="footer-nav">
          <a href="/privacy" className="footer-link footer-pill">Privacy Policy</a>
          <a href="/terms" className="footer-link footer-pill">Terms of Service</a>
          <a href="mailto:oyola.ai.inc@gmail.com" className="footer-link footer-pill">Contact</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;


