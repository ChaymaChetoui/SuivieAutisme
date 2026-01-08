// src/pages/TherapistPatients.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import therapistService from '../services/therapistService';
import childService from '../services/childService';
import Layout from '../components/dashboard/Layout';
import Loading from '../components/common/loading';
import Modal from '../components/common/Modal';
import { 
  User, 
  Calendar, 
  Activity, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle,
  Heart,
  Brain,
  Clock,
  Users,
  Sparkles,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const TherapistPatients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    if (user?.role === 'therapist') {
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await therapistService.getMyPatients();
      const patientsData = response.data || [];
      
      // Trier les patients
      const sortedPatients = [...patientsData].sort((a, b) => {
        if (sortBy === 'name') {
          return a.firstName.localeCompare(b.firstName);
        } else if (sortBy === 'level') {
          const levelMap = { 'léger': 1, 'modéré': 2, 'sévère': 3 };
          return (levelMap[b.autismLevel] || 0) - (levelMap[a.autismLevel] || 0);
        }
        return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
      });
      
      setPatients(sortedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPatient = (patientId) => {
    navigate(`/children/${patientId}/edit`);
  };

  const handleViewProfile = (patientId) => {
    navigate(`/therapist/patients/${patientId}`);
  };

  const handleAddEmotion = (patientId) => {
    navigate(`/emotions/new?childId=${patientId}`);
  };

  const handleDeleteClick = (patient) => {
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;

    try {
      setDeleting(true);
      await childService.deleteChild(selectedPatient._id);
      toast.success('Patient supprimé avec succès');
      setPatients(prev => prev.filter(p => p._id !== selectedPatient._id));
      setShowDeleteModal(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.loginCode && patient.loginCode.includes(searchTerm))
  );

  const getAgeColor = (age) => {
    if (!age) return '#9ca3af';
    if (age < 3) return '#3b82f6';
    if (age < 6) return '#10b981';
    if (age < 12) return '#f59e0b';
    return '#ef4444';
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'léger': return '#10b981';
      case 'modéré': return '#f59e0b';
      case 'sévère': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement des patients..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="greeting-section">
              <h1 className="dashboard-title">
                <span className="wave-emoji">👨‍⚕️</span>
                Mes Patients
              </h1>
              <p className="dashboard-subtitle">
                {patients.length} patient{patients.length !== 1 ? 's' : ''} sous votre suivi
              </p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => navigate('/therapist/unassigned-children')}
                className="btn btn-secondary btn-with-icon"
              >
                <Users className="icon" />
                <span>Assigner</span>
              </button>
              <button
                onClick={() => navigate('/children/new')}
                className="btn btn-primary btn-with-icon"
              >
                <Plus className="icon" />
                <span>Nouveau</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Patients actifs</p>
                <p className="stat-value">{patients.length}</p>
                <div className="stat-trend">
                  <Users className="trend-icon" />
                  <span>Sous votre suivi</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-blue">
                <Users className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-blue"></div>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Âge moyen</p>
                <p className="stat-value">
                  {patients.length > 0 
                    ? Math.round(patients.reduce((acc, p) => acc + (p.age || 0), 0) / patients.length)
                    : 0
                  }
                </p>
                <div className="stat-trend">
                  <Clock className="trend-icon" />
                  <span>années</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-green">
                <Clock className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-green"></div>
          </div>

          <div className="stat-card stat-card-yellow">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Niveau moyen</p>
                <p className="stat-value">
                  {patients.length > 0 
                    ? patients.reduce((acc, p) => {
                        const levelMap = { 'léger': 1, 'modéré': 2, 'sévère': 3 };
                        return acc + (levelMap[p.autismLevel] || 0);
                      }, 0) / patients.length > 2 ? 'Élevé' : 'Moyen'
                    : '-'
                  }
                </p>
                <div className="stat-trend">
                  <Activity className="trend-icon" />
                  <span>sur l'échelle</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-yellow">
                <Brain className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-yellow"></div>
          </div>

          <div className="stat-card stat-card-purple">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Garçons/Filles</p>
                <p className="stat-value">
                  {patients.filter(p => p.gender === 'male').length}/{patients.filter(p => p.gender === 'female').length}
                </p>
                <div className="stat-trend">
                  <Heart className="trend-icon" />
                  <span>ratio</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-purple">
                <Heart className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-purple"></div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="filter-bar">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-actions">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="recent">Plus récent</option>
              <option value="name">A → Z</option>
              <option value="level">Niveau</option>
            </select>
            
            <button className="btn btn-secondary btn-with-icon">
              <Filter className="icon" />
              <span>Filtrer</span>
            </button>
          </div>
        </div>

        {/* Patients Grid */}
        {filteredPatients.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-wrapper">
              <Users className="empty-icon" />
            </div>
            <h3 className="empty-title">
              {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient pour le moment'}
            </h3>
            <p className="empty-description">
              {searchTerm 
                ? 'Essayez avec d\'autres termes de recherche'
                : 'Commencez par ajouter votre premier patient'
              }
            </p>
            <div className="empty-actions">
              <button
                onClick={() => navigate('/children/new')}
                className="btn btn-primary btn-with-icon"
              >
                <Plus className="icon" />
                Ajouter un patient
              </button>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn btn-secondary"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="patients-grid">
              {filteredPatients.map((patient, index) => (
                <div 
                  key={patient._id} 
                  className="patient-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="patient-card-header">
                    <div 
                      className="patient-avatar"
                      style={{ 
                        background: `linear-gradient(135deg, ${getAgeColor(patient.age)}, ${getLevelColor(patient.autismLevel)})`
                      }}
                    >
                      {patient.firstName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="patient-info">
                      <h3 className="patient-name">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <div className="patient-tags">
                        <span 
                          className="patient-tag"
                          style={{ 
                            backgroundColor: `${getAgeColor(patient.age)}20`,
                            color: getAgeColor(patient.age)
                          }}
                        >
                          {patient.age || '?'} ans
                        </span>
                        <span 
                          className="patient-tag"
                          style={{ 
                            backgroundColor: `${getLevelColor(patient.autismLevel)}20`,
                            color: getLevelColor(patient.autismLevel)
                          }}
                        >
                          {patient.autismLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="patient-details">
                    <div className="patient-detail">
                      <Calendar className="detail-icon" />
                      <span className="detail-text">
                        Code: <strong>{patient.loginCode || 'Non défini'}</strong>
                      </span>
                    </div>
                    
                    {patient.diagnosticDate && (
                      <div className="patient-detail">
                        <Clock className="detail-icon" />
                        <span className="detail-text">
                          Diagnostic: {new Date(patient.diagnosticDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    
                    {patient.medicalNotes && (
                      <p className="patient-notes">
                        {patient.medicalNotes}
                      </p>
                    )}
                  </div>

                  <div className="patient-actions">
                    <button
                      onClick={() => handleViewProfile(patient._id)}
                      className="action-btn primary-btn"
                      title="Voir profil"
                    >
                      <User className="action-icon" />
                    </button>
                    
                    <button
                      onClick={() => handleAddEmotion(patient._id)}
                      className="action-btn secondary-btn"
                      title="Ajouter une émotion"
                    >
                      <Activity className="action-icon" />
                    </button>
                    
                    <button
                      onClick={() => handleEditPatient(patient._id)}
                      className="action-btn warning-btn"
                      title="Modifier"
                    >
                      <Edit className="action-icon" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteClick(patient)}
                      className="action-btn danger-btn"
                      title="Supprimer"
                    >
                      <Trash2 className="action-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pagination-info">
              <span className="pagination-text">
                Affichage de {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}

        {/* AI CTA Card */}
        <div className="ai-cta-card">
          <div className="ai-cta-background"></div>
          <div className="ai-cta-content">
            <div className="ai-cta-text">
              <div className="ai-cta-header">
                <Sparkles className="ai-icon" />
                <h3 className="ai-title">Analyse avancée des patients</h3>
              </div>
              <p className="ai-description">
                Accédez à des insights détaillés, des tendances émotionnelles et des recommandations personnalisées pour chacun de vos patients.
              </p>
            </div>
            <button className="btn btn-ai">
              Explorer les analyses
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPatient(null);
        }}
        title="Confirmer la suppression"
        size="md"
      >
        <div className="modal-content">
          <div className="warning-section">
            <AlertCircle className="warning-icon" />
            <div className="warning-text">
              <h4 className="warning-title">Attention !</h4>
              <p className="warning-description">
                Cette action est irréversible. Toutes les données associées à ce patient seront définitivement supprimées.
              </p>
            </div>
          </div>

          {selectedPatient && (
            <div className="patient-preview">
              <div 
                className="preview-avatar"
                style={{ 
                  background: `linear-gradient(135deg, ${getAgeColor(selectedPatient.age)}, ${getLevelColor(selectedPatient.autismLevel)})`
                }}
              >
                {selectedPatient.firstName?.charAt(0).toUpperCase()}
              </div>
              <div className="preview-info">
                <h4 className="preview-name">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h4>
                <p className="preview-details">
                  {selectedPatient.age || '?'} ans • {selectedPatient.loginCode || 'Sans code'}
                </p>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedPatient(null);
              }}
              className="btn btn-secondary"
              disabled={deleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDeletePatient}
              className="btn btn-danger"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="spinner"></div>
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="action-icon" />
                  <span>Supprimer définitivement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
        }

        /* Header */
        .dashboard-header {
          margin-bottom: 3rem;
          animation: fadeInDown 0.6s ease-out;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .header-content {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .greeting-section {
          flex: 1;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .wave-emoji {
          display: inline-block;
          animation: wave 2s ease-in-out infinite;
        }

        .dashboard-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          font-weight: 400;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-with-icon {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-with-icon .icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          position: relative;
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .stat-card-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #111827;
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #16a34a;
          font-weight: 500;
        }

        .trend-icon {
          width: 1rem;
          height: 1rem;
        }

        .stat-icon-wrapper {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-icon {
          width: 1.75rem;
          height: 1.75rem;
        }

        .stat-icon-blue {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }

        .stat-icon-blue .stat-icon {
          color: #1d4ed8;
        }

        .stat-icon-green {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        }

        .stat-icon-green .stat-icon {
          color: #15803d;
        }

        .stat-icon-yellow {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
        }

        .stat-icon-yellow .stat-icon {
          color: #d97706;
        }

        .stat-icon-purple {
          background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
        }

        .stat-icon-purple .stat-icon {
          color: #7e22ce;
        }

        .stat-card-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .stat-card:hover .stat-card-glow {
          opacity: 0.15;
        }

        .stat-glow-blue {
          background: radial-gradient(circle at top right, #3b82f6, transparent);
        }

        .stat-glow-green {
          background: radial-gradient(circle at top right, #10b981, transparent);
        }

        .stat-glow-yellow {
          background: radial-gradient(circle at top right, #f59e0b, transparent);
        }

        .stat-glow-purple {
          background: radial-gradient(circle at top right, #a855f7, transparent);
        }

        /* Filter Bar */
        .filter-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 1.5rem;
          border: 1px solid #e5e7eb;
        }

        @media (min-width: 768px) {
          .filter-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .search-container {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .sort-select {
          padding: 0.875rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          background: white;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sort-select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        /* Patients Grid */
        .patients-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .patients-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .patients-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .patient-card {
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .patient-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #bfdbfe;
        }

        .patient-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .patient-avatar {
          width: 4rem;
          height: 4rem;
          border-radius: 1.25rem;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s ease;
        }

        .patient-card:hover .patient-avatar {
          transform: scale(1.1) rotate(5deg);
        }

        .patient-info {
          flex: 1;
        }

        .patient-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .patient-tags {
          display: flex;
          gap: 0.5rem;
        }

        .patient-tag {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .patient-card:hover .patient-tag {
          transform: translateY(-1px);
        }

        .patient-details {
          margin-bottom: 1.5rem;
        }

        .patient-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .detail-icon {
          width: 1rem;
          height: 1rem;
          color: #9ca3af;
        }

        .patient-notes {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          max-height: 4.5rem;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .patient-actions {
          display: flex;
          gap: 0.5rem;
          border-top: 1px solid #f3f4f6;
          padding-top: 1.5rem;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .primary-btn {
          background: #eff6ff;
          color: #2563eb;
        }

        .secondary-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .warning-btn {
          background: #fef3c7;
          color: #d97706;
        }

        .danger-btn {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Empty State */
        .empty-state-card {
          background: white;
          border-radius: 2rem;
          padding: 4rem 2rem;
          text-align: center;
          border: 1px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        .empty-icon-wrapper {
          width: 6rem;
          height: 6rem;
          margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-icon {
          width: 3rem;
          height: 3rem;
          color: #9ca3af;
        }

        .empty-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.75rem;
        }

        .empty-description {
          font-size: 1.125rem;
          color: #6b7280;
          margin-bottom: 2rem;
          max-width: 32rem;
          margin-left: auto;
          margin-right: auto;
        }

        .empty-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Pagination Info */
        .pagination-info {
          text-align: center;
          padding: 1.5rem;
          background: white;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        .pagination-text {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 500;
        }

        /* AI CTA Card */
        .ai-cta-card {
          position: relative;
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
          border-radius: 2rem;
          padding: 2rem;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(13, 148, 136, 0.2);
          animation: fadeInUp 0.6s ease-out 0.7s backwards;
        }

        .ai-cta-background {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(13, 148, 136, 0.4) 0%, transparent 50%);
          animation: pulse 4s ease-in-out infinite;
        }

        .ai-cta-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .ai-cta-content {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .ai-cta-text {
          flex: 1;
        }

        .ai-cta-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .ai-icon {
          width: 2rem;
          height: 2rem;
          color: white;
          animation: sparkle 2s ease-in-out infinite;
        }

        .ai-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        .ai-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          max-width: 48rem;
        }

        .btn-ai {
          padding: 0.875rem 1.5rem;
          background: white;
          color: #0f766e;
          border-radius: 1rem;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .btn-ai:hover {
          background: #f0fdfa;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        /* Modal Styles */
        .modal-content {
          padding: 1rem;
        }

        .warning-section {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #fef2f2;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .warning-icon {
          width: 2rem;
          height: 2rem;
          color: #dc2626;
          flex-shrink: 0;
        }

        .warning-text {
          flex: 1;
        }

        .warning-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #7f1d1d;
          margin-bottom: 0.25rem;
        }

        .warning-description {
          font-size: 0.875rem;
          color: #991b1b;
          line-height: 1.5;
        }

        .patient-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          }
          .child-avatar {
                    width: 4rem;
                    height: 4rem;
                    border-radius: 1.25rem;
                    background: linear-gradient(135deg, #3b82f6, #7c3aed);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
                    transition: transform 0.3s ease;
                  }
          
                  .child-item:hover .child-avatar {
                    transform: scale(1.1) rotate(5deg);
                  }
          
                  .child-name {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 0.25rem;
                  }
          
                  .child-details {
                    font-size: 0.875rem;
                    color: #6b7280;
                  }
          
                  .child-arrow {
                    width: 1.5rem;
                    height: 1.5rem;
                    color: #9ca3af;
                    transition: all 0.3s ease;
                  }
          
                  .child-item:hover .child-arrow {
                    color: #2563eb;
                    transform: translateX(4px);
                  }
          
                  /* Emotions List */
                  .emotions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                  }
          
                  .emotion-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem;
                    border-radius: 1.25rem;
                    background: #f9fafb;
                    transition: all 0.3s ease;
                    animation: fadeIn 0.4s ease-out backwards;
                  }
          
                  .emotion-item:hover {
                    background: #f3f4f6;
                    transform: scale(1.02);
                  }
          
                  .emotion-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex: 1;
                  }
          
                  .emotion-info {
                    flex: 1;
                  }
          
                  .emotion-child {
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 0.25rem;
                  }
          
                  .emotion-context {
                    font-size: 0.875rem;
                    color: #6b7280;
                  }
          
                  .emotion-time {
                    font-size: 0.875rem;
                    color: #9ca3af;
                    white-space: nowrap;
                  }
          
                  /* AI CTA Card */
                  .ai-cta-card {
                    position: relative;
                    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
                    border-radius: 2rem;
                    padding: 3rem;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(37, 99, 235, 0.3);
                    animation: fadeInUp 0.6s ease-out 0.7s backwards;
                  }
          
                  .ai-cta-background {
                    position: absolute;
                    inset: 0;
                    background: 
                      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.4) 0%, transparent 50%);
                    animation: pulse 4s ease-in-out infinite;
                  }
          
                  .ai-cta-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                  }
          
                  @media (min-width: 1024px) {
                    .ai-cta-content {
                      flex-direction: row;
                      align-items: center;
                      justify-content: space-between;
                    }
                  }
          
                  .ai-cta-text {
                    flex: 1;
                  }
          
                  .ai-cta-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                  }
          
                  .ai-icon {
                    width: 2.5rem;
                    height: 2.5rem;
                    color: white;
                    animation: sparkle 2s ease-in-out infinite;
                  }
          
                  @keyframes sparkle {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
                  }
          
                  .ai-title {
                    font-size: 1.875rem;
                    font-weight: 800;
                    color: white;
                  }
          
                  .ai-description {
                    font-size: 1.125rem;
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.6;
                    max-width: 48rem;
                  }
          
                  .btn-ai {
                    padding: 1rem 2rem;
                    background: white;
                    color: #2563eb;
                    border-radius: 1rem;
                    font-weight: 700;
                    font-size: 1.125rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                  }
          
                  .btn-ai:hover {
                    background: #eff6ff;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
                  }
          
                  /* Animations */
                  @keyframes fadeInDown {
                    from {
                      opacity: 0;
                      transform: translateY(-30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
          
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
          
                  @keyframes fadeIn {
                    from {
                      opacity: 0;
                    }
                    to {
                      opacity: 1;
                    }
                  }
          
                  @keyframes slideInLeft {
                    from {
                      opacity: 0;
                      transform: translateX(-30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                    }
                  }
          
                  @keyframes pulse {
                    0%, 100% {
                      opacity: 1;
                    }
                    50% {
                      opacity: 0.8;
                    }
                  }
                `}</style>
              </Layout>
            );
          };
          export default TherapistPatients;