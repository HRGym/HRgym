import React, { useState, useEffect } from 'react';
import { getMembers, deleteMember, getStaffUsers, deleteStaffUser } from '../firebase';
import MemberFormModal from './MemberFormModal';
import StaffFormModal from './StaffFormModal';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  LogOut, 
  Sparkles,
  AlertTriangle,
  User,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'staff'
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'expired'
  
  // Staff management states
  const [staffUsers, setStaffUsers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({}); // docId -> bool

  // Modals states
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Staff modals
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffDeleteConfirmOpen, setStaffDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Current logged in admin
  const [currentUser, setCurrentUser] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const data = await getStaffUsers();
      setStaffUsers(data);
    } catch (error) {
      console.error("Failed to load staff accounts:", error);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchStaff();
    
    // Get currently logged in user info
    const saved = localStorage.getItem('logged_in_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const calculateRemaining = (expiryStr) => {
    if (!expiryStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryStr);
    expiry.setHours(0, 0, 0, 0);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Stats calculation
  const totalCount = members.length;
  const activeCount = members.filter(m => calculateRemaining(m.expiryDate) >= 0).length;
  const expiredCount = totalCount - activeCount;
  const expiringSoonCount = members.filter(m => {
    const rem = calculateRemaining(m.expiryDate);
    return rem >= 0 && rem <= 7;
  }).length;

  const handleDeleteClick = (member, e) => {
    e.stopPropagation();
    setMemberToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteMember(memberToDelete.docId);
      setMembers(prev => prev.filter(m => m.docId !== memberToDelete.docId));
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    } catch (err) {
      console.error("Error deleting member:", err);
      alert("Failed to delete member. Try again.");
    }
  };

  const handleEditClick = (member, e) => {
    e.stopPropagation();
    setEditingMember(member);
    setFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingMember(null);
    setFormOpen(true);
  };

  const handleFormSave = () => {
    fetchMembers(); // reload list
  };

  // Staff CRUD Actions
  const handleAddStaffClick = () => {
    setEditingStaff(null);
    setStaffFormOpen(true);
  };

  const handleEditStaffClick = (staff, e) => {
    e.stopPropagation();
    setEditingStaff(staff);
    setStaffFormOpen(true);
  };

  const handleDeleteStaffClick = (staff, e) => {
    e.stopPropagation();
    
    // Prevent self-deletion
    if (currentUser && currentUser.docId === staff.docId) {
      alert("អ្នកមិនអាចលុបគណនីផ្ទាល់ខ្លួនរបស់អ្នកបានទេ! / You cannot delete your own account!");
      return;
    }

    setStaffToDelete(staff);
    setStaffDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaffUser(staffToDelete.docId);
      setStaffUsers(prev => prev.filter(s => s.docId !== staffToDelete.docId));
      setStaffDeleteConfirmOpen(false);
      setStaffToDelete(null);
    } catch (err) {
      console.error("Error deleting staff:", err);
      alert("Failed to delete staff account.");
    }
  };

  const handleStaffFormSave = () => {
    fetchStaff(); // reload list
  };

  const togglePasswordVisibility = (docId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  // Filtered members list
  const filteredMembers = members.filter(m => {
    const remaining = calculateRemaining(m.expiryDate);
    const isActive = remaining >= 0;
    
    // Status filter
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'expired' && isActive) return false;
    
    // Search filter (ID, name, phone)
    const matchSearch = searchTerm.toLowerCase();
    const nameMatch = m.name?.toLowerCase().includes(matchSearch);
    const phoneMatch = m.phone?.includes(matchSearch);
    const idMatch = m.id?.includes(matchSearch);
    
    return nameMatch || phoneMatch || idMatch;
  });

  const formatDateKhmer = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="admin-grid">
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
        <button 
          className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('members')}
          style={{ borderRadius: '50px', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <Users size={16} /> សមាជិកក្លឹប / Members ({totalCount})
        </button>
        <button 
          className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('staff')}
          style={{ borderRadius: '50px', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <User size={16} /> គណនីបុគ្គលិក / Staff Accounts ({staffUsers.length})
        </button>
      </div>

      {activeTab === 'members' ? (
        <>
          {/* Analytics Strip */}
          <div className="stats-strip">
            {/* Total */}
            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper total">
                <Users size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{totalCount}</span>
                <span className="stat-label">សមាជិកសរុប / Total</span>
              </div>
            </div>

            {/* Active */}
            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper active">
                <UserCheck size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value" style={{ color: 'var(--success)' }}>{activeCount}</span>
                <span className="stat-label">សកម្ម / Active</span>
              </div>
            </div>

            {/* Expired */}
            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper expired">
                <UserX size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value" style={{ color: 'var(--danger)' }}>{expiredCount}</span>
                <span className="stat-label">ហួសកំណត់ / Expired</span>
              </div>
            </div>

            {/* Expiring Soon */}
            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper soon">
                <Clock size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value" style={{ color: '#f59e0b' }}>{expiringSoonCount}</span>
                <span className="stat-label">ជិតផុតកំណត់ / Expiring Soon</span>
              </div>
            </div>
          </div>

          {/* Main Members Table Panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Table Controls */}
            <div className="table-controls">
              <div className="search-filters">
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ស្វែងរកតាម ឈ្មោះ លេខទូរស័ព្ទ ឬ ID / Search name, phone, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.9rem' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">ស្ថានភាពទាំងអស់ / All Status</option>
                  <option value="active">សកម្ម / Active</option>
                  <option value="expired">ហួសកំណត់ / Expired</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleAddClick} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  <Plus size={16} /> បន្ថែមសមាជិក / Add Member
                </button>
                <button className="btn btn-secondary" onClick={onLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  <LogOut size={16} /> Logout / ចាកចេញ
                </button>
              </div>
            </div>

            {/* Datatable viewport */}
            <div className="table-responsive">
              {loading ? (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="soundwave active" style={{ height: '30px', marginBottom: '1rem' }}>
                    <div className="soundwave-bar"></div>
                    <div className="soundwave-bar"></div>
                    <div className="soundwave-bar"></div>
                    <div className="soundwave-bar"></div>
                  </div>
                  កំពុងទាញយកទិន្នន័យ... / Loading database...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Kantumruy Pro' }}>
                  មិនមានទិន្នន័យសមាជិកឡើយ / No member records found.
                </div>
              ) : (
                <table className="member-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>លេខរៀង / ID</th>
                      <th style={{ width: '70px' }}>រូបថត / Photo</th>
                      <th>ឈ្មោះ / Name</th>
                      <th>លេខទូរស័ព្ទ / Phone</th>
                      <th>ថ្ងៃចាប់ផ្តើម / Start</th>
                      <th>ថ្ងៃផុតកំណត់ / Expiry</th>
                      <th>រយៈពេល / Paid</th>
                      <th>ថ្ងៃនៅសល់ / Remaining</th>
                      <th>ស្ថានភាព / Status</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>សកម្មភាព / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(m => {
                      const remaining = calculateRemaining(m.expiryDate);
                      const isExpired = remaining < 0;
                      
                      return (
                        <tr key={m.docId}>
                          <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{m.id}</td>
                          <td>
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt={m.name} className="table-img" />
                            ) : (
                              <div className="table-img" style={{ background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <Sparkles size={16} />
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: '500' }}>{m.name}</td>
                          <td>{m.phone}</td>
                          <td>{formatDateKhmer(m.startDate)}</td>
                          <td style={{ color: isExpired ? 'var(--danger)' : 'var(--success)', fontWeight: '500' }}>
                            {formatDateKhmer(m.expiryDate)}
                          </td>
                          <td>{m.monthsPaid} ខែ / Month(s)</td>
                          <td style={{ fontWeight: '700', color: isExpired ? 'var(--danger)' : 'var(--success)' }}>
                            {isExpired ? `Expired (${Math.abs(remaining)}d)` : `${remaining} days`}
                          </td>
                          <td>
                            <span className={`status-badge ${isExpired ? 'expired' : 'active'}`}>
                              {isExpired ? 'ហួសកំណត់' : 'សកម្ម'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions" style={{ justifyContent: 'center' }}>
                              <button 
                                className="btn btn-secondary" 
                                onClick={(e) => handleEditClick(m, e)}
                                style={{ padding: '6px', borderRadius: '4px' }}
                                title="Edit / កែប្រែ"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="btn btn-danger" 
                                onClick={(e) => handleDeleteClick(m, e)}
                                style={{ padding: '6px', borderRadius: '4px' }}
                                title="Delete / លុប"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Staff Management Tab View */
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Controls */}
          <div className="table-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'Kantumruy Pro' }}>គណនីបុគ្គលិក / Staff Accounts</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={handleAddStaffClick} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                <Plus size={16} /> បន្ថែមបុគ្គលិក / Add Staff User
              </button>
              <button className="btn btn-secondary" onClick={onLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                <LogOut size={16} /> Logout / ចាកចេញ
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            {staffLoading ? (
              <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                កំពុងទាញយកគណនី... / Loading accounts...
              </div>
            ) : staffUsers.length === 0 ? (
              <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'Kantumruy Pro' }}>
                មិនទាន់មានគណនីបុគ្គលិកនៅឡើយទេ / No staff accounts.
              </div>
            ) : (
              <table className="member-table">
                <thead>
                  <tr>
                    <th>ឈ្មោះ / Full Name</th>
                    <th>អ៊ីមែល / Email Address</th>
                    <th>លេខសម្ងាត់ / Password</th>
                    <th>តួនាទី / Role</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>សកម្មភាព / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffUsers.map(s => {
                    const isSelf = currentUser && currentUser.docId === s.docId;
                    const showPass = !!visiblePasswords[s.docId];
                    
                    return (
                      <tr key={s.docId} style={isSelf ? { background: 'rgba(194, 255, 10, 0.02)' } : {}}>
                        <td style={{ fontWeight: '600' }}>
                          {s.name} {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontStyle: 'italic', marginLeft: '6px' }}>(You)</span>}
                        </td>
                        <td>{s.email}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{showPass ? s.password : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(s.docId)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                              title={showPass ? "Hide / លាក់" : "Reveal / បង្ហាញ"}
                            >
                              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${s.role === 'admin' ? 'active' : 'expired'}`} style={s.role === 'admin' ? { color: 'var(--primary)', background: 'rgba(194, 255, 10, 0.1)' } : {}}>
                            {s.role === 'admin' ? 'Admin / អ្នកគ្រប់គ្រង' : 'Staff / បុគ្គលិក'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              onClick={(e) => handleEditStaffClick(s, e)}
                              style={{ padding: '6px', borderRadius: '4px' }}
                              title="Edit / កែប្រែ"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={(e) => handleDeleteStaffClick(s, e)}
                              style={{ padding: '6px', borderRadius: '4px' }}
                              disabled={isSelf}
                              title="Delete / លុប"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Members */}
      {deleteConfirmOpen && memberToDelete && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: '2rem 1.5rem' }}>
              <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '1.5rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'Kantumruy Pro' }}>លុបទិន្នន័យសមាជិក?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Are you sure you want to delete member <strong>{memberToDelete.name}</strong> (ID: {memberToDelete.id})? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel / បោះបង់
                </button>
                <button className="btn btn-danger" onClick={handleConfirmDelete}>
                  Confirm Delete / លុប
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Staff */}
      {staffDeleteConfirmOpen && staffToDelete && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: '2rem 1.5rem' }}>
              <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '1.5rem' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'Kantumruy Pro' }}>លុបគណនីបុគ្គលិក?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Are you sure you want to delete staff account <strong>{staffToDelete.name}</strong> ({staffToDelete.email})? They will lose access to lookups.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setStaffDeleteConfirmOpen(false)}>
                  Cancel / បោះបង់
                </button>
                <button className="btn btn-danger" onClick={handleConfirmDeleteStaff}>
                  Confirm Delete / លុបគណនី
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal Form */}
      <MemberFormModal 
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        member={editingMember}
        onSave={handleFormSave}
      />

      {/* Add / Edit Staff Modal Form */}
      <StaffFormModal 
        isOpen={staffFormOpen}
        onClose={() => setStaffFormOpen(false)}
        staffUser={editingStaff}
        onSave={handleStaffFormSave}
      />

    </div>
  );
}
