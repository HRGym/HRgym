import React, { useState, useEffect } from 'react';
import { searchMemberByPhone } from '../firebase';
import { Search, Phone, Volume2, VolumeX, AlertCircle, Sparkles } from 'lucide-react';

export default function StaffPortal() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(null);
  const [searched, setSearched] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play synthesized sounds using Web Audio API
  const playStatusSound = (statusType) => {
    if (!soundEnabled) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (statusType === 'active') {
        // High-energy positive double chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (statusType === 'expired') {
        // Warning buzz (low sawtooth wave)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime); // C3
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      } else if (statusType === 'not_found') {
        // Double medium warning beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (err) {
      console.error("Synthesizer error:", err);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    setMember(null);
    setSearched(false);

    try {
      const results = await searchMemberByPhone(phoneNumber);
      if (results.length > 0) {
        const found = results[0];
        setMember(found);
        setSearched(true);
        
        const remaining = calculateRemaining(found.expiryDate);
        if (remaining >= 0) {
          playStatusSound('active');
        } else {
          playStatusSound('expired');
        }
      } else {
        setMember(null);
        setSearched(true);
        playStatusSound('not_found');
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (val) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + val);
    }
  };

  const handleKeypadDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPhoneNumber('');
    setMember(null);
    setSearched(false);
  };

  const calculateRemaining = (expiryStr) => {
    if (!expiryStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryStr);
    expiry.setHours(0, 0, 0, 0);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDateKhmer = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    // Return D/M/YYYY
    return `${d}/${m}/${y}`;
  };

  const remainingDays = member ? calculateRemaining(member.expiryDate) : 0;
  const isExpired = remainingDays < 0;

  return (
    <div className={`staff-layout ${member || (searched && !member) ? 'has-result' : ''}`}>
      
      {/* Search Console */}
      <div className="glass-panel search-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="search-title" style={{ fontSize: '1.25rem', textAlign: 'left' }}>
            ស្វែងរកសមាជិក / Member Lookup
          </h2>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ padding: '6px 10px', borderRadius: '50px', display: 'flex', gap: '4px', fontSize: '0.8rem' }}
          >
            {soundEnabled ? (
              <>
                <Volume2 size={14} className="text-primary" style={{ color: 'var(--primary)' }} /> Sound ON
              </>
            ) : (
              <>
                <VolumeX size={14} /> Sound OFF
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSearch}>
          <div className="search-box-container">
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-input search-input"
                placeholder="បញ្ចូលលេខទូរស័ព្ទ / Enter Phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
              <Phone size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            
            <button type="submit" className="btn btn-primary search-btn" disabled={loading}>
              {loading ? (
                <div className="soundwave active">
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                  <div className="soundwave-bar"></div>
                </div>
              ) : (
                <>
                  <Search size={18} /> ស្វែងរក
                </>
              )}
            </button>
          </div>
        </form>

        {/* Digital Numeric Keypad */}
        <div style={{ marginTop: '0.5rem' }}>
          <div className="keypad-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                className="keypad-btn" 
                onClick={() => handleKeypadPress(num.toString())}
              >
                {num}
              </button>
            ))}
            <button 
              className="keypad-btn" 
              style={{ fontSize: '1rem', color: 'var(--text-muted)' }}
              onClick={handleKeypadClear}
            >
              Clear
            </button>
            <button 
              className="keypad-btn" 
              onClick={() => handleKeypadPress('0')}
            >
              0
            </button>
            <button 
              className="keypad-btn" 
              onClick={handleKeypadDelete}
            >
              ⌫
            </button>
          </div>
        </div>
      </div>

      {/* Results Display Console */}
      {searched && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {member ? (
            <div className={`glass-panel result-card ${isExpired ? 'status-expired' : 'status-active'}`}>
              
              {/* Massive Status Indicator */}
              <div className={`status-banner ${isExpired ? 'expired' : 'active'}`}>
                {isExpired ? 'ហួសកំណត់ / EXPIRED' : 'សមាជិកសកម្ម / ACTIVE'}
              </div>

              {/* Member Detailed View */}
              <div className="member-display">
                {/* Photo frame */}
                <div className="member-image-frame">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} />
                  ) : (
                    <div className="member-image-placeholder">
                      <Sparkles size={48} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>

                {/* Info Cards Grid */}
                <div className="info-grid">
                  
                  {/* Sequence ID */}
                  <div className="info-item">
                    <div className="info-label">លេខរៀង / Member ID</div>
                    <div className="info-val" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                      {member.id}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="info-item">
                    <div className="info-label">ឈ្មោះ / Member Name</div>
                    <div className="info-val">{member.name}</div>
                  </div>

                  {/* Phone */}
                  <div className="info-item">
                    <div className="info-label">លេខទូរស័ព្ទ / Phone</div>
                    <div className="info-val">{member.phone}</div>
                  </div>

                  {/* Months Paid */}
                  <div className="info-item">
                    <div className="info-label">ចំនួនបង់ខែ / Months Paid</div>
                    <div className="info-val">{member.monthsPaid} ខែ / Month(s)</div>
                  </div>

                  {/* Start Date */}
                  <div className="info-item">
                    <div className="info-label">ថ្ងៃខែចាប់ផ្តើម / Start Date</div>
                    <div className="info-val">{formatDateKhmer(member.startDate)}</div>
                  </div>

                  {/* Expiry Date */}
                  <div className="info-item">
                    <div className="info-label">ថ្ងៃខែផុតកំណត់ / Expiry Date</div>
                    <div className="info-val" style={{ color: isExpired ? 'var(--danger)' : 'var(--success)' }}>
                      {formatDateKhmer(member.expiryDate)}
                    </div>
                  </div>

                  {/* Large Days Remaining widget */}
                  <div className="days-widget">
                    <div className="days-number">
                      {isExpired ? Math.abs(remainingDays) : remainingDays}
                    </div>
                    <div className="days-title">
                      {isExpired ? 'ថ្ងៃហួសកំណត់ / Days Expired' : 'ថ្ងៃនៅសល់ / Days Remaining'}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel result-card status-expired" style={{ minHeight: '300px' }}>
              <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'Kantumruy Pro' }}>
                រកមិនឃើញសមាជិក
              </h3>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '300px' }}>
                មិនមានទិន្នន័យសម្រាប់លេខទូរស័ព្ទ <strong style={{ color: 'var(--text-main)' }}>{phoneNumber}</strong> ឡើយ។
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                No active membership record found for this number.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
