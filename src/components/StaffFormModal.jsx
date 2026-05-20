import React, { useState, useEffect } from 'react';
import { addStaffUser, updateStaffUser } from '../firebase';
import { X, Save, Key, User } from 'lucide-react';

export default function StaffFormModal({ isOpen, onClose, staffUser, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (staffUser) {
        // Edit mode
        setFormData({
          name: staffUser.name || '',
          email: staffUser.email || '',
          password: staffUser.password || '',
          role: staffUser.role || 'staff'
        });
      } else {
        // Add mode
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'staff'
        });
      }
      setErrorMsg('');
      setSaving(false);
    }
  }, [isOpen, staffUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setErrorMsg("All fields are required / សូមបំពេញព័ត៌មានទាំងអស់");
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      if (staffUser) {
        // Edit Mode
        await updateStaffUser(staffUser.docId, formData);
      } else {
        // Add Mode
        await addStaffUser(formData);
      }
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error("StaffFormModal save failed:", err);
      if (err.message.includes("already registered")) {
        setErrorMsg("អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ / Email already registered");
      } else {
        setErrorMsg("រក្សាទុកបរាជ័យ។ សូមព្យាយាមម្តងទៀត / Failed to save. Try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
            {staffUser ? 'កែប្រែគណនីបុគ្គលិក / Edit Staff Account' : 'បង្កើតគណនីបុគ្គលិកថ្មី / Add New Staff'}
          </h3>
          <button className="close-btn" onClick={onClose} disabled={saving}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                color: 'var(--danger)',
                fontSize: '0.85rem'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Name */}
            <div className="form-group">
              <label className="form-label">ឈ្មោះបុគ្គលិក / Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Sok Dara"
                className="form-input"
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">អ៊ីមែល / Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. dara@hrgym.com"
                className="form-input"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">លេខសម្ងាត់ / Password</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password for login"
                className="form-input"
                required
              />
            </div>

            {/* Role select */}
            <div className="form-group">
              <label className="form-label">តួនាទី / System Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
                style={{ background: 'rgba(15, 23, 42, 0.8)', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <option value="staff">Staff / បុគ្គលិក check-in</option>
                <option value="admin">Admin / អ្នកគ្រប់គ្រងប្រព័ន្ធ</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                * Admin accounts have full permissions (manage members & staff). Staff accounts can only search and verify check-ins.
              </p>
            </div>

          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={saving}
            >
              Cancel / បោះបង់
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
            >
              <Save size={16} /> Save Account / រក្សាទុក
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
