import React, { useState, useEffect } from 'react';
import { getSystemConfig, saveSystemConfig } from '../firebase';
import { X, Save, Key, Database, Image } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSaveSuccess }) {
  const [config, setConfig] = useState({
    firebaseApiKey: '',
    firebaseAuthDomain: '',
    firebaseProjectId: '',
    firebaseStorageBucket: '',
    firebaseMessagingSenderId: '',
    firebaseAppId: '',
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
    adminPasscode: '1234'
  });

  useEffect(() => {
    if (isOpen) {
      const current = getSystemConfig();
      setConfig({
        firebaseApiKey: current.apiKey || '',
        firebaseAuthDomain: current.authDomain || '',
        firebaseProjectId: current.projectId || '',
        firebaseStorageBucket: current.storageBucket || '',
        firebaseMessagingSenderId: current.messagingSenderId || '',
        firebaseAppId: current.appId || '',
        cloudinaryCloudName: current.cloudinaryCloudName || '',
        cloudinaryUploadPreset: current.cloudinaryUploadPreset || '',
        adminPasscode: current.adminPasscode || '1234'
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveSystemConfig(config);
    if (onSaveSuccess) onSaveSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
            System Configurations / ការកំណត់ប្រព័ន្ធ
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Admin Security */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={16} /> Admin Settings / សន្តិសុខ
              </h4>
              <div className="form-group">
                <label className="form-label">Admin Passcode / កូដសម្ងាត់ Admin</label>
                <input
                  type="text"
                  name="adminPasscode"
                  value={config.adminPasscode}
                  onChange={handleChange}
                  placeholder="e.g. 1234"
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* Firebase Configurations */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} /> Firebase Firestore Settings
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input
                    type="password"
                    name="firebaseApiKey"
                    value={config.firebaseApiKey}
                    onChange={handleChange}
                    placeholder="AIzaSy..."
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project ID</label>
                  <input
                    type="text"
                    name="firebaseProjectId"
                    value={config.firebaseProjectId}
                    onChange={handleChange}
                    placeholder="gym-tracking-123"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Auth Domain</label>
                  <input
                    type="text"
                    name="firebaseAuthDomain"
                    value={config.firebaseAuthDomain}
                    onChange={handleChange}
                    placeholder="gym-tracking-123.firebaseapp.com"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Storage Bucket</label>
                  <input
                    type="text"
                    name="firebaseStorageBucket"
                    value={config.firebaseStorageBucket}
                    onChange={handleChange}
                    placeholder="gym-tracking-123.appspot.com"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Messaging Sender ID</label>
                  <input
                    type="text"
                    name="firebaseMessagingSenderId"
                    value={config.firebaseMessagingSenderId}
                    onChange={handleChange}
                    placeholder="84729104829"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">App ID</label>
                  <input
                    type="text"
                    name="firebaseAppId"
                    value={config.firebaseAppId}
                    onChange={handleChange}
                    placeholder="1:847291:web:9c..."
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Cloudinary Configurations */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Image size={16} /> Cloudinary Settings (Image Upload)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Cloud Name</label>
                  <input
                    type="text"
                    name="cloudinaryCloudName"
                    value={config.cloudinaryCloudName}
                    onChange={handleChange}
                    placeholder="e.g. dxyz1234"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Preset (Unsigned)</label>
                  <input
                    type="text"
                    name="cloudinaryUploadPreset"
                    value={config.cloudinaryUploadPreset}
                    onChange={handleChange}
                    placeholder="e.g. gym_preset"
                    className="form-input"
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Note: Ensure the Cloudinary upload preset is set to <strong>Unsigned</strong> in your Cloudinary Dashboard settings under Upload.
              </p>
            </div>
            
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel / បោះបង់
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Settings / រក្សាទុក
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
