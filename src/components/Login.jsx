import React, { useState, useEffect } from 'react';
import { authenticateUser } from '../firebase';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedPassword = localStorage.getItem('remembered_password');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all fields / សូមបំពេញព័ត៌មានទាំងអស់");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const user = await authenticateUser(email, password);
      
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('remembered_password', password);
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remembered_password');
      }

      // Pass the authenticated user credentials up
      onLoginSuccess(user);
    } catch (err) {
      console.error("Login component error:", err);
      // Give a helpful user-friendly Khmer & English message
      if (err.message.includes("not found")) {
        setErrorMsg("រកមិនឃើញគណនីនេះទេ / Account not found");
      } else if (err.message.includes("password")) {
        setErrorMsg("លេខសម្ងាត់មិនត្រឹមត្រូវ / Incorrect password");
      } else {
        setErrorMsg("ការចូលប្រព័ន្ធបរាជ័យ។ សូមពិនិត្យការតភ្ជាប់ / Connection failed. Check settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      width: '100%',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.4s ease-out'
      }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="brand-logo" style={{ justifyContent: 'center', fontSize: '2.2rem', marginBottom: '4px' }}>
            HR <span style={{ color: 'var(--text-main)' }}>GYM</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'Kantumruy Pro' }}>
            ប្រព័ន្ធគ្រប់គ្រងសមាជិក / Member System
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="form-group">
            <label className="form-label">အီးម៉ែល / Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. adminhr@gym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">លេខសម្ងាត់ / Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            userSelect: 'none'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontFamily: 'Kantumruy Pro, sans-serif'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              />
              ចងចាំគណនី និងលេខសម្ងាត់ / Remember Me
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? (
              <div className="soundwave active" style={{ height: '16px', gap: '2px' }}>
                <div className="soundwave-bar" style={{ width: '2px', background: 'var(--text-dark)' }}></div>
                <div className="soundwave-bar" style={{ width: '2px', background: 'var(--text-dark)' }}></div>
                <div className="soundwave-bar" style={{ width: '2px', background: 'var(--text-dark)' }}></div>
              </div>
            ) : (
              <>
                <LogIn size={18} /> ចូលប្រព័ន្ធ / Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <p>Default Admin: <strong>adminhr@gym.com</strong> / <strong>admin123</strong></p>
          <p style={{ marginTop: '4px' }}>Please update default credentials inside the admin dashboard.</p>
        </div>

      </div>
    </div>
  );
}
