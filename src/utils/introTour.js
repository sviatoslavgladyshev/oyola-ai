// Intro.js helper: reusable loader and tours (buyer/owner)
// Uses CDN assets and expects styling to be provided via app CSS
import { authorizeGmailAccess } from '../services/authService';

const ensureCss = () => new Promise((res) => {
  // We rely on app CSS for theme, but Intro.js base CSS is still needed
  if (document.querySelector('link[data-introjs-base]')) return res(true);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/intro.js/minified/introjs.min.css';
  link.setAttribute('data-introjs-base', '1');
  link.onload = () => res(true);
  document.head.appendChild(link);
});

const ensureJs = () => new Promise((res) => {
  if (window.introJs && window.introJs.tour) return res(true);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/intro.js/minified/intro.min.js';
  script.onload = () => res(true);
  document.body.appendChild(script);
});

export const loadIntroAssets = async () => {
  await ensureCss();
  await ensureJs();
};

const showGmailConnectPrompt = () => {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-in;
  `;
  
  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 32px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
  `;
  
  modal.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">📧</div>
      <h2 style="margin: 0 0 12px 0; font-size: 24px; color: #1a1a1a;">Connect Gmail</h2>
      <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">
        Connect your Gmail account to send emails directly to property owners from the platform.
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="gmail-prompt-connect" style="
          background: #4285f4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#357ae8'" onmouseout="this.style.background='#4285f4'">
          ✉️ Connect Gmail
        </button>
        <button id="gmail-prompt-later" style="
          background: #f5f5f5;
          color: #666;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#e8e8e8'" onmouseout="this.style.background='#f5f5f5'">
          Maybe Later
        </button>
      </div>
    </div>
  `;
  
  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Handle connect button
  const connectBtn = modal.querySelector('#gmail-prompt-connect');
  connectBtn.addEventListener('click', async () => {
    // Show loader - disable button and update content
    connectBtn.disabled = true;
    connectBtn.style.cursor = 'not-allowed';
    connectBtn.style.opacity = '0.8';
    
    // Create spinner element
    const spinner = document.createElement('span');
    spinner.style.cssText = `
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    `;
    
    // Update button content
    connectBtn.innerHTML = '';
    connectBtn.appendChild(spinner);
    connectBtn.appendChild(document.createTextNode('Connecting...'));
    
    try {
      await authorizeGmailAccess();
      // If redirect happens, this won't execute, which is fine
    } catch (e) {
      // Restore button on error
      connectBtn.disabled = false;
      connectBtn.style.cursor = 'pointer';
      connectBtn.style.opacity = '1';
      connectBtn.innerHTML = '✉️ Connect Gmail';
      console.error('Failed to start Gmail auth', e);
      alert('Failed to connect Gmail. Please try again.');
    }
  });
  
  // Handle later button
  const laterBtn = modal.querySelector('#gmail-prompt-later');
  laterBtn.addEventListener('click', () => {
    overlay.remove();
    style.remove();
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      style.remove();
    }
  });
};

export const startBuyerTour = async (onComplete) => {
  await loadIntroAssets();
  const steps = [
    { intro: 'Quick tour to get you started.' },
    { element: document.querySelector('.user-menu-trigger'), intro: 'Access your profile and settings here.' },
    { element: document.querySelector('.city-grid-container'), intro: 'Explore popular cities and pick one to focus your search.' },
    { element: document.querySelector('.dashboard-form-column') || document.querySelector('.offer-form-card'), intro: 'Fill out this form to submit offers to property owners.' },
    { element: document.querySelector('.dashboard-offers-tracker'), intro: 'Track your offers here. Status flows Sent → Viewed → Accepted/Declined with progress.' },
    { element: document.querySelector('.offer-form-simple .btn-submit-modern'), intro: 'Final step: click here to create and send your offer.' },
  ].filter(s => !s.element || (s.element && s.element instanceof Element));
  const tour = window.introJs.tour().setOptions({ steps, showProgress: true, doneLabel: 'Finish' });
  // Darken entire screen on first step only
  const clearFirstStepOverlay = () => document.body.classList.remove('intro-first-step');
  let firstStepHandled = false;
  // Ensure class is present for very first step even before events fire
  document.body.classList.add('intro-first-step');
  
  tour.onafterchange(async (targetElement) => {
    if (!firstStepHandled) {
      // Keep class for step 1 and mark handled
      document.body.classList.add('intro-first-step');
      firstStepHandled = true;
    } else {
      // Any subsequent step: remove strong overlay
      clearFirstStepOverlay();
    }
  });
  
  const cleanup = () => {
    clearFirstStepOverlay();
  };
  
  const handleComplete = () => {
    cleanup();
    // Show Gmail connect prompt after tour completes
    setTimeout(() => {
      showGmailConnectPrompt();
    }, 300);
    if (typeof onComplete === 'function') {
      onComplete();
    }
  };
  
  tour.onexit(cleanup);
  tour.oncomplete(handleComplete);
  tour.start();
};

export const startOwnerTour = async (onComplete) => {
  await loadIntroAssets();
  const steps = [
    { element: document.querySelector('.user-menu-trigger'), intro: 'Access your profile and settings here.' },
    { element: document.querySelector('.container-single'), intro: 'Manage your properties and view offers here.' },
  ].filter(s => !s.element || (s.element && s.element instanceof Element));
  const tour = window.introJs.tour().setOptions({ steps, showProgress: true });
  // Darken entire screen on first step only
  const clearFirstStepOverlay = () => document.body.classList.remove('intro-first-step');
  let firstStepHandled = false;
  // Ensure class is present for very first step even before events fire
  document.body.classList.add('intro-first-step');
  tour.onafterchange(() => {
    if (!firstStepHandled) {
      document.body.classList.add('intro-first-step');
      firstStepHandled = true;
    } else {
      clearFirstStepOverlay();
    }
  });
  tour.onexit(clearFirstStepOverlay).oncomplete(clearFirstStepOverlay);
  if (typeof onComplete === 'function') {
    tour.oncomplete(onComplete).onexit(onComplete);
  }
  tour.start();
};

const introTour = { loadIntroAssets, startBuyerTour, startOwnerTour };
export default introTour;


