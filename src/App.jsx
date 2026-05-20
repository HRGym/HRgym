import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, getSystemConfig } from './firebase';
import StaffPortal from './components/StaffPortal';
import AdminDashboard from './components/AdminDashboard';
import SettingsModal from './components/SettingsModal';
import Login from './components/Login';
import { Settings, Shield, UserCheck, LogOut, Lock, User } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null); // { docId, email, name, role }
  const [view, setView] = useState('staff'); // 'staff' or 'admin'
  const [isConfigured, setIsConfigured] = useState(isFirebaseConfigured());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check for active login session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('logged_in_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Default admin to admin dashboard, staff to search portal
        if (parsedUser.role === 'admin') {
          setView('admin');
        } else {
          setView('staff');
        }
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('logged_in_user');
      }
    }
  }, []);

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

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    localStorage.setItem('logged_in_user', JSON.stringify(authenticatedUser));
    
    // Redirect based on role
    if (authenticatedUser.role === 'admin') {
      setView('admin');
    } else {
      setView('staff');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('logged_in_user');
    setView('staff');
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
          {/* Controls visible only if logged in */}
          {user && (
            <>
              <button 
                className={`btn ${view === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView('staff')}
              >
                <UserCheck size={18} />
                Staff Search / សមាជិក
              </button>
              
              {/* Admin Panel button - Admin only */}
              {user.role === 'admin' && (
                <button 
                  className={`btn ${view === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setView('admin')}
                >
                  <Shield size={18} />
                  Admin Panel / គ្រប់គ្រង
                </button>
              )}
            </>
          )}

          {/* Settings gear - visible to admins, or if not configured */}
          {(!isConfigured || (user && user.role === 'admin')) && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsSettingsOpen(true)}
              title="System Settings"
              style={{ padding: '0.75rem' }}
            >
              <Settings size={18} />
            </button>
          )}

          {/* Log Out button */}
          {user && (
            <button 
              className="btn btn-danger" 
              onClick={handleLogout}
              title="Log Out / ចាកចេញ"
              style={{ padding: '0.75rem' }}
            >
              <LogOut size={18} />
            </button>
          )}
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
        ) : !user ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {/* Display logged in user details banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                Logged in as / គណនីកំពុងប្រើប្រាស់: <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong> ({user.role === 'admin' ? 'Administrator' : 'Staff'})
              </span>
              <span>{user.email}</span>
            </div>

            {view === 'staff' && <StaffPortal />}
            
            {view === 'admin' && user.role === 'admin' && (
              <AdminDashboard onLogout={handleLogout} />
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
