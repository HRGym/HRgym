import React, { useState, useEffect } from 'react';
import { addMember, updateMember } from '../firebase';
import { uploadToCloudinary } from '../cloudinary';
import CameraCapture from './CameraCapture';
import confetti from 'canvas-confetti';
import { X, Save, Camera, Upload, Sparkles } from 'lucide-react';

export default function MemberFormModal({ isOpen, onClose, member, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    monthsPaid: 1,
    startDate: '',
    expiryDate: '',
    photoUrl: ''
  });
  
  const [customMonths, setCustomMonths] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null); // File object or base64 string
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Expiry date auto-calculator
  const computeExpiryDate = (startDateVal, monthsVal) => {
    if (!startDateVal) return '';
    const parts = startDateVal.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    date.setMonth(date.getMonth() + parseInt(monthsVal, 10));
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      if (member) {
        // Editing mode
        setFormData({
          id: member.id || '',
          name: member.name || '',
          phone: member.phone || '',
          monthsPaid: member.monthsPaid || 1,
          startDate: member.startDate || todayStr,
          expiryDate: member.expiryDate || '',
          photoUrl: member.photoUrl || ''
        });
        setPhotoPreview(member.photoUrl || '');
        setPhotoFile(null);
        
        // Detect if months paid is custom
        const predefined = [1, 3, 6, 12];
        setCustomMonths(!predefined.includes(member.monthsPaid));
      } else {
        // Adding mode
        setFormData({
          id: '',
          name: '',
          phone: '',
          monthsPaid: 1,
          startDate: todayStr,
          expiryDate: computeExpiryDate(todayStr, 1),
          photoUrl: ''
        });
        setPhotoPreview('');
        setPhotoFile(null);
        setCustomMonths(false);
      }
      setCameraOpen(false);
      setSaving(false);
      setUploadProgress(false);
    }
  }, [isOpen, member]);

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'startDate') {
      const newExpiry = computeExpiryDate(value, formData.monthsPaid);
      setFormData(prev => ({ ...prev, startDate: value, expiryDate: newExpiry }));
    } else if (name === 'monthsPaid') {
      const newExpiry = computeExpiryDate(formData.startDate, value);
      setFormData(prev => ({ ...prev, monthsPaid: value, expiryDate: newExpiry }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDurationSelect = (months) => {
    if (months === 'custom') {
      setCustomMonths(true);
    } else {
      setCustomMonths(false);
      const newExpiry = computeExpiryDate(formData.startDate, months);
      setFormData(prev => ({ ...prev, monthsPaid: months, expiryDate: newExpiry }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (base64Data) => {
    setPhotoFile(base64Data);
    setPhotoPreview(base64Data);
    setCameraOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone number are required!");
      return;
    }

    setSaving(true);
    let finalPhotoUrl = formData.photoUrl;

    // 1. Upload to Cloudinary if new image selected
    if (photoFile) {
      setUploadProgress(true);
      try {
        finalPhotoUrl = await uploadToCloudinary(photoFile);
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        alert("Failed to upload image to Cloudinary. Checking credentials in Settings.");
        setSaving(false);
        setUploadProgress(false);
        return;
      }
      setUploadProgress(false);
    }

    // 2. Save member to Firestore
    try {
      const submitData = {
        ...formData,
        photoUrl: finalPhotoUrl
      };

      if (member) {
        // Edit mode
        await updateMember(member.docId, submitData);
      } else {
        // Add mode
        await addMember(submitData);
        // Confetti burst for new registration!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#c2ff0a', '#10b981', '#3b82f6']
        });
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Database save failed:", error);
      alert("Error saving member details. Check Firebase configurations.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {member ? 'កែប្រែព័ត៌មានសមាជិក / Edit Member' : 'ចុះឈ្មោះសមាជិកថ្មី / Register New Member'}
          </h3>
          <button className="close-btn" onClick={onClose} disabled={saving}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Live camera module or form inputs */}
            {cameraOpen ? (
              <CameraCapture 
                onCapture={handleCameraCapture} 
                onCancel={() => setCameraOpen(false)} 
              />
            ) : (
              <>
                {/* Photo Upload Area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  {photoPreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(''); setPhotoFile(null); }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'var(--danger)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="table-img" style={{ width: '100px', height: '100px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <Sparkles size={36} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setCameraOpen(true)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <Camera size={14} /> Take Photo / ថតរូប
                    </button>
                    <label 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      <Upload size={14} /> Upload / បញ្ចូលរូប
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                  </div>
                </div>

                {/* ID input (Optional override) */}
                <div className="form-group">
                  <label className="form-label">លេខរៀងសមាជិក / Member ID (ស្វ័យប្រវត្តបើទុកទំនេរ)</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    placeholder="Auto-incremented ID"
                    className="form-input"
                  />
                </div>

                {/* Name */}
                <div className="form-group">
                  <label className="form-label">ឈ្មោះសមាជិក / Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. HAN TAO"
                    className="form-input"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label">លេខទូរស័ព្ទ / Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 010317585"
                    className="form-input"
                    required
                  />
                </div>

                {/* Start Date */}
                <div className="form-group">
                  <label className="form-label">ថ្ងៃខែចាប់ផ្តើម / Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                {/* Months Paid (Duration) */}
                <div className="form-group">
                  <label className="form-label">រយៈពេលបង់ប្រាក់ / Months Paid</label>
                  
                  {!customMonths ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                      {[1, 3, 6, 12].map(m => (
                        <button
                          key={m}
                          type="button"
                          className={`btn ${formData.monthsPaid === m ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '8px 0', fontSize: '0.85rem' }}
                          onClick={() => handleDurationSelect(m)}
                        >
                          {m} ខែ
                        </button>
                      ))}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '8px 0', fontSize: '0.85rem' }}
                        onClick={() => handleDurationSelect('custom')}
                      >
                        ផ្សេងៗ
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        name="monthsPaid"
                        value={formData.monthsPaid}
                        onChange={handleChange}
                        min="1"
                        max="120"
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => { setCustomMonths(false); handleDurationSelect(1); }}
                        style={{ fontSize: '0.85rem' }}
                      >
                        Predefined
                      </button>
                    </div>
                  )}
                </div>

                {/* Expiry Date (calculated) */}
                <div className="form-group">
                  <label className="form-label">ថ្ងៃផុតកំណត់ / Expiration Date (ស្វ័យប្រវត្ត)</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="form-input"
                    style={{ borderColor: 'rgba(194, 255, 10, 0.25)', color: 'var(--primary)' }}
                    required
                  />
                </div>
              </>
            )}

          </div>

          {!cameraOpen && (
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
                style={{ minWidth: '130px' }}
              >
                {saving ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="soundwave active" style={{ height: '14px', gap: '2px' }}>
                      <div className="soundwave-bar" style={{ width: '2px', background: 'var(--text-dark)' }}></div>
                      <div className="soundwave-bar" style={{ width: '2px', background: 'var(--text-dark)' }}></div>
                      <div className="soundwave-bar" style={{ width: '2px', background: 'var(--text-dark)' }}></div>
                    </div>
                    {uploadProgress ? 'Uploading...' : 'Saving...'}
                  </div>
                ) : (
                  <>
                    <Save size={16} /> Save / រក្សាទុក
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
