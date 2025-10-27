import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { sendPasswordResetEmail } from '../services/authService';

const ForgotPassword = ({ onBack, onClose }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Shared function that calls auth service
  const sendResetEmail = async (isResend = false) => {
    setError('');
    setIsLoading(true);

    const action = isResend ? 'Resending' : 'Starting';
    alert(`🔍 DEBUG: ${action} password reset for: ${email}`);
    console.log(`🔐 ${action} password reset email to:`, email);

    try {
      // Call auth service - all business logic is there
      await sendPasswordResetEmail(email);
      
      console.log('✅ Password reset email sent successfully to:', email);
      const message = isResend ? 'Email sent again' : 'Email sent';
      alert(`✅ SUCCESS! ${message} to: ${email}\nCheck your inbox AND spam folder!`);
      setSuccess(true);
    } catch (err) {
      console.error('❌ Failed to send password reset email:', {
        email: email,
        error: err.message,
        errorCode: err.code,
        fullError: err,
      });
      alert('❌ ERROR: ' + err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendResetEmail(false);
  };

  if (success) {
    const openEmailApp = () => {
      // Try to open default email app
      window.location.href = 'mailto:';
    };

    const handleResend = async () => {
      // Use the same shared function with isResend flag
      await sendResetEmail(true);
    };

    return (
      <div className="forgot-password-modal">
        <div className="forgot-password-card">
          <div className="success-icon">✉️</div>
          <h2>Check Your Email</h2>
          <p className="success-message">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="helper-text">
            Please check your inbox (and spam folder) and click the link to reset your password.
            The link will expire in 1 hour.
          </p>
          
          {error && (
            <div className="auth-error" style={{ marginTop: '16px' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="button-group-vertical">
            <Button 
              variant="primary" 
              className="full-width-btn"
              onClick={openEmailApp}
            >
              📧 Open Mail App
            </Button>
            <Button 
              variant="reset" 
              className="full-width-btn"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Resending...' : '🔄 Resend Email'}
            </Button>
            <Button 
              variant="reset" 
              className="full-width-btn"
              onClick={onBack}
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-modal" onClick={onClose}>
      <div className="forgot-password-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 Reset Password</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <p className="modal-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="auth-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="full-width-btn"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Sending...' : '📧 Send Reset Link'}
          </Button>
        </form>

        <div className="modal-footer">
          <button className="link-button" onClick={onBack}>
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

