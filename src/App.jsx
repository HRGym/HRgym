import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, getSystemConfig } from './firebase';
import StaffPortal from './components/StaffPortal';
import AdminDashboard from './components/AdminDashboard';
import SettingsModal from './components/SettingsModal';
import { Settings, Shield, UserCheck, Key, Lock, Eye, EyeOff } from 'lucide-react';

function App() {
  const [view, setView] = useState('staff'); // 'staff' or 'admin'
  const [isConfigured, setIsConfigured] = useState(isFirebaseConfigured());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Recheck configuration
  const handleConfigUpdate = () => {
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);
    if (!configured) {
      setIsSettingsOpen(true);
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      setIsSettingsOpen(true);
    }
  }, [isConfigured]);

  const handleAdminAccess = () => {
    if (adminAuth) {
      setView('admin');
    } else {
      setView('pin_challenge');
      setPinCode('');
      setPinError(false);
    }
  };

  const handlePinSubmit = (e) => {
    e?.preventDefault();
    const config = getSystemConfig();
    const correctPin = config.adminPasscode || '1234';
    
    if (pinCode === correctPin) {
      setAdminAuth(true);
      setView('admin');
      setPinError(false);
    } else {
      setPinError(true);
      setPinCode('');
      // Vibrate if mobile
      if (navigator.vibrate) navigator.vibrate(200);
      setTimeout(() => setPinError(false), 800);
    }
  };

  const handlePinKeypad = (num) => {
    setPinError(false);
    if (pinCode.length < 8) {
      const newPin = pinCode + num;
      setPinCode(newPin);
    }
  };

  const handlePinBackspace = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPinCode('');
  };

  return (
    <div className="app-container">
      {/* Top Application Bar */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">
            HR <span style={{ color: 'var(--text-main)' }}>GYM</span>
          </div>
          <div className="brand-subtitle">| ប្រព័ន្ធគ្រប់គ្រងសមាជិក</div>
        </div>
        
        <div className="nav-buttons">
          {view !== 'pin_challenge' && (
            <>
              <button 
                className={`btn ${view === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView('staff')}
              >
                <UserCheck size={18} />
                Staff Search / សមាជិក
              </button>
              
              <button 
                className={`btn ${view === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleAdminAccess}
              >
                <Shield size={18} />
                Admin Panel / គ្រប់គ្រង
              </button>
            </>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={() => setIsSettingsOpen(true)}
            title="System Settings"
            style={{ padding: '0.75rem' }}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main App Content Viewport */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!isConfigured ? (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '4rem auto', width: '100%' }}>
            <Lock size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 8px var(--primary-glow))' }} />
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Configuration Required</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Please configure Firebase and Cloudinary credentials to initialize the application database and photo uploader.
            </p>
            <button className="btn btn-primary" onClick={() => setIsSettingsOpen(true)}>
              Open Settings / កំណត់ប្រព័ន្ធ
            </button>
          </div>
        ) : (
          <>
            {view === 'staff' && <StaffPortal />}
            
            {view === 'admin' && adminAuth && (
              <AdminDashboard onLogout={() => {
                setAdminAuth(false);
                setView('staff');
              }} />
            )}

            {view === 'pin_challenge' && (
              <div className="glass-panel pin-challenge">
                <Lock size={36} style={{ color: pinError ? 'var(--danger)' : 'var(--primary)', marginBottom: '1rem', transition: 'color 0.3s' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'Kantumruy Pro' }}>Admin Verification</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Please enter admin passcode to access panel
                </p>

                {/* Password input display */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <input
                    type={showPin ? "text" : "password"}
                    value={pinCode}
                    readOnly
                    placeholder="••••••"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      letterSpacing: '6px',
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.2)',
                      border: `1px solid ${pinError ? 'var(--danger)' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: pinError ? 'var(--danger)' : 'var(--text-main)',
                      outline: 'none',
                      boxShadow: pinError ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Visual PIN dots */}
                <div className="pin-dots">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`pin-dot ${pinCode.length > i ? 'filled' : ''} ${pinError ? 'danger' : ''}`}
                      style={pinError ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger)' } : {}}
                    />
                  ))}
                </div>

                {/* Keypad */}
                <div className="keypad-grid" style={{ maxWidth: '280px', margin: '0 auto' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                      key={num}
                      type="button"
                      className="keypad-btn"
                      onClick={() => handlePinKeypad(num.toString())}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="keypad-btn"
                    style={{ fontSize: '1rem', color: 'var(--text-muted)' }}
                    onClick={handlePinClear}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="keypad-btn"
                    onClick={() => handlePinKeypad('0')}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="keypad-btn"
                    style={{ fontSize: '1rem', color: 'var(--text-muted)' }}
                    onClick={handlePinBackspace}
                  >
                    ⌫
                  </button>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={handlePinSubmit}>
                    Verify Passcode
                  </button>
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setView('staff')}>
                    Back / ត្រឡប់ក្រោយ
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Global Config Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSaveSuccess={handleConfigUpdate}
      />
    </div>
  );
}

export default App;
