// src/pages/TherapistDashboard.jsx - AVEC CSS COMPLET
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/dashboard/Layout';
import Loading from '../components/common/loading';
import therapistService from '../services/therapistService';
import emotionService from '../services/emotionService';
import aiService from '../services/aiService';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Activity,
  FileText,
  Brain,
  Plus,
  UserPlus,
  BarChart3,
  Lightbulb,
  Star,
  Target,
  Zap,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const TherapistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    withConcerns: 0,
    totalEmotions: 0,
    avgProgress: 0,
    upcomingSessions: 0,
    completedSessions: 0
  });
  const [patients, setPatients] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [therapistStats, setTherapistStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les stats du thérapeute
      const statsResponse = await therapistService.getTherapistStats();
      setTherapistStats(statsResponse.data);
      
      // Récupérer les patients du thérapeute
      const patientsResponse = await therapistService.getMyPatients();
      const myPatients = patientsResponse.data || [];

      // Calculer les statistiques pour chaque patient
      const patientsWithStats = await Promise.all(
        myPatients.map(async (patient) => {
          try {
            const emotionsResponse = await emotionService.getEmotionsByChild(patient._id, { limit: 50 });
            const emotions = emotionsResponse.data || [];
            const negativeEmotions = emotions.filter(e => 
              ['colère', 'peur', 'tristesse', 'dégoût'].includes(e.emotion)
            );
            const positiveCount = emotions.filter(e => 
              ['joie', 'surprise'].includes(e.emotion)
            ).length;
            const progress = emotions.length > 0 
              ? Math.round((positiveCount / emotions.length) * 100) 
              : 0;
            const lastActivity = emotions[0]?.timestamp || patient.updatedAt || patient.createdAt;

            return {
              ...patient,
              emotionCount: emotions.length,
              concerns: negativeEmotions.length,
              progress,
              lastActivity,
              recentEmotions: emotions.slice(0, 3)
            };
          } catch (error) {
            console.error(`Error fetching data for patient ${patient._id}:`, error);
            return {
              ...patient,
              emotionCount: 0,
              concerns: 0,
              progress: 0,
              lastActivity: patient.updatedAt || patient.createdAt,
              recentEmotions: []
            };
          }
        })
      );

      patientsWithStats.sort((a, b) => 
        new Date(b.lastActivity) - new Date(a.lastActivity)
      );

      const totalEmotions = patientsWithStats.reduce((sum, p) => sum + p.emotionCount, 0);
      const totalConcerns = patientsWithStats.filter(p => p.concerns > 0).length;
      const avgProgress = patientsWithStats.length > 0
        ? Math.round(patientsWithStats.reduce((sum, p) => sum + p.progress, 0) / patientsWithStats.length)
        : 0;

      setStats({
        totalPatients: patientsWithStats.length,
        withConcerns: totalConcerns,
        totalEmotions,
        avgProgress,
        upcomingSessions: therapistStats?.upcomingSessions || 0,
        completedSessions: therapistStats?.completedSessions || 0
      });

      setPatients(patientsWithStats);

      const allEmotions = [];
      for (const patient of patientsWithStats.slice(0, 3)) {
        if (patient.recentEmotions && patient.recentEmotions.length > 0) {
          patient.recentEmotions.forEach(emotion => {
            allEmotions.push({
              ...emotion,
              patientName: `${patient.firstName} ${patient.lastName}`
            });
          });
        }
      }
      
      allEmotions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(allEmotions.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (patientId) => {
    try {
      toast.loading('Génération du rapport...', { id: 'report' });
      await aiService.generateProgressReport(patientId);
      toast.success('Rapport généré avec succès', { id: 'report' });
      navigate(`/children/${patientId}`);
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport', { id: 'report' });
    }
  };

  const handleAddEmotion = (patientId) => {
    navigate(`/emotions/new?childId=${patientId}`);
  };

  const getProgressColor = (progress) => {
    if (progress >= 70) return '#10b981';
    if (progress >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      'joie': '#fbbf24',
      'tristesse': '#60a5fa',
      'colère': '#ef4444',
      'peur': '#a78bfa',
      'surprise': '#f472b6',
      'dégoût': '#84cc16'
    };
    return colors[emotion] || '#9ca3af';
  };

  const formatDate = (date) => {
    if (!date) return 'Jamais';
    const d = new Date(date);
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement du tableau de bord..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="greeting-section">
            <h1 className="dashboard-title">
              <span className="welcome-emoji">👨‍⚕️</span>
              Bonjour, <span className="therapist-name">{user?.profile?.firstName || 'Thérapeute'}</span>
            </h1>
            <p className="dashboard-subtitle">
              {patients.length > 0 
                ? `Vous suivez ${patients.length} patient${patients.length > 1 ? 's' : ''}`
                : 'Commencez par ajouter votre premier patient'
              }
            </p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => navigate('/children/new')}
              className="btn btn-primary btn-with-icon"
            >
              <UserPlus className="btn-icon" />
              <span>Nouveau patient</span>
            </button>
            <button 
              onClick={() => navigate('/therapist/unassigned-children')}
              className="btn btn-secondary btn-with-icon"
            >
              <Users className="btn-icon" />
              <span>Patients disponibles</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <Users className="stat-icon" />
              </div>
              <div className="stat-info">
                <h3 className="stat-value">{stats.totalPatients}</h3>
                <p className="stat-label">Patients actifs</p>
                <div className="stat-trend">
                  <TrendingUp className="trend-icon" />
                  <span>{stats.withConcerns} avec alertes</span>
                </div>
              </div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <TrendingUp className="stat-icon" />
              </div>
              <div className="stat-info">
                <h3 className="stat-value">{stats.avgProgress}<span className="percent">%</span></h3>
                <p className="stat-label">Progression moyenne</p>
                <div className="stat-trend">
                  <Star className="trend-icon" />
                  <span>Dernier mois</span>
                </div>
              </div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <Activity className="stat-icon" />
              </div>
              <div className="stat-info">
                <h3 className="stat-value">{stats.totalEmotions}</h3>
                <p className="stat-label">Émotions enregistrées</p>
                <div className="stat-trend">
                  <Zap className="trend-icon" />
                  <span>Cette semaine</span>
                </div>
              </div>
            </div>
            <div className="stat-glow"></div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-content">
              <div className="stat-icon-wrapper">
                <Calendar className="stat-icon" />
              </div>
              <div className="stat-info">
                <h3 className="stat-value">{stats.completedSessions}</h3>
                <p className="stat-label">Sessions complétées</p>
                <div className="stat-trend">
                  <Clock className="trend-icon" />
                  <span>{stats.upcomingSessions} à venir</span>
                </div>
              </div>
            </div>
            <div className="stat-glow"></div>
          </div>
        </div>

        {/* Main Content */}
        {patients.length === 0 ? (
          <div className="empty-dashboard">
            <div className="empty-illustration">
              <div className="illustration-background"></div>
              <Users className="empty-icon" />
            </div>
            <div className="empty-content">
              <h3 className="empty-title">Aucun patient pour le moment</h3>
              <p className="empty-description">
                Commencez par ajouter votre premier patient pour suivre son évolution et analyser ses émotions
              </p>
              <div className="empty-actions">
                <button 
                  onClick={() => navigate('/children/new')}
                  className="btn btn-primary btn-lg btn-with-icon"
                >
                  <UserPlus className="btn-icon" />
                  Ajouter un patient
                </button>
                <button 
                  onClick={() => navigate('/therapist/unassigned-children')}
                  className="btn btn-secondary btn-lg btn-with-icon"
                >
                  <Users className="btn-icon" />
                  Voir les patients disponibles
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Patients Section */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">
                  <Users className="section-icon" />
                  Mes Patients
                </h2>
                <Link to="/therapist/patients" className="section-link">
                  <span>Voir tout ({patients.length})</span>
                  <ChevronRight className="link-icon" />
                </Link>
              </div>
              
              <div className="patients-grid">
                {patients.slice(0, 5).map((patient, index) => (
                  <div 
                    key={patient._id} 
                    className="patient-card"
                    onClick={() => navigate(`/children/${patient._id}`)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="patient-header">
                      <div 
                        className="patient-avatar"
                        style={{ 
                          background: `linear-gradient(135deg, ${getProgressColor(patient.progress)} 0%, ${getEmotionColor('joie')} 100%)` 
                        }}
                      >
                        {patient.firstName.charAt(0)}
                      </div>
                      <div className="patient-info">
                        <h3 className="patient-name">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <div className="patient-details">
                          <span className="patient-age">{patient.age} ans</span>
                          <span className="patient-gender">{patient.gender === 'male' ? 'Garçon' : 'Fille'}</span>
                          <span className={`patient-level patient-level-${patient.autismLevel?.toLowerCase()}`}>
                            {patient.autismLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="patient-progress">
                      <div className="progress-header">
                        <span className="progress-label">Progression émotionnelle</span>
                        <span className="progress-value" style={{ color: getProgressColor(patient.progress) }}>
                          {patient.progress}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${patient.progress}%`,
                            background: `linear-gradient(90deg, ${getProgressColor(patient.progress)} 0%, ${getEmotionColor('joie')} 100%)`
                          }}
                        >
                          <div className="progress-glow"></div>
                        </div>
                      </div>
                    </div>

                    <div className="patient-actions">
                      <div className="activity-info">
                        <span className="activity-label">
                          {patient.concerns > 0 ? (
                            <>
                              <AlertCircle className="alert-icon" />
                              {patient.concerns} alerte{patient.concerns > 1 ? 's' : ''}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="check-icon" />
                              Pas d'alerte
                            </>
                          )}
                        </span>
                        <span className="activity-time">
                          {formatDate(patient.lastActivity)}
                        </span>
                      </div>
                      <div className="action-buttons">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddEmotion(patient._id);
                          }}
                          className="action-btn btn-secondary"
                          title="Ajouter une émotion"
                        >
                          <Plus className="action-icon" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateReport(patient._id);
                          }}
                          className="action-btn btn-primary"
                          title="Générer rapport IA"
                        >
                          <Brain className="action-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="dashboard-sidebar">
              {/* Recent Activity */}
              <div className="sidebar-card activity-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <Activity className="card-icon" />
                    Activité Récente
                  </h3>
                </div>
                
                {recentActivity.length === 0 ? (
                  <div className="empty-activity">
                    <Activity className="empty-icon" />
                    <p className="empty-text">Aucune activité récente</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {recentActivity.map((activity, index) => (
                      <div 
                        key={activity._id} 
                        className="activity-item"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="activity-header">
                          <span className="activity-patient">{activity.patientName}</span>
                          <span className="activity-time">{formatDate(activity.timestamp)}</span>
                        </div>
                        <div className="activity-content">
                          <div className="emotion-badge" style={{ 
                            backgroundColor: `${getEmotionColor(activity.emotion)}20`,
                            color: getEmotionColor(activity.emotion)
                          }}>
                            {activity.emotion}
                          </div>
                          {activity.intensity && (
                            <div className="intensity-indicator">
                              <div className="intensity-track">
                                <div 
                                  className="intensity-level"
                                  style={{ 
                                    width: `${(activity.intensity / 5) * 100}%`,
                                    backgroundColor: getEmotionColor(activity.emotion)
                                  }}
                                />
                              </div>
                              <span className="intensity-value">{activity.intensity}/5</span>
                            </div>
                          )}
                        </div>
                        {activity.context && (
                          <p className="activity-context">{activity.context}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="sidebar-card stats-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <Target className="card-icon" />
                    Statistiques Rapides
                  </h3>
                </div>
                <div className="quick-stats">
                  <div className="quick-stat">
                    <span className="stat-number">{stats.withConcerns}</span>
                    <span className="stat-label">Alertes actives</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-number">{Math.round(stats.totalEmotions / patients.length)}</span>
                    <span className="stat-label">Moyenne émotions/patient</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-number">{patients.length > 0 ? patients[0].firstName : '-'}</span>
                    <span className="stat-label">Dernière activité</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="quick-actions-grid">
          <div 
            className="quick-action action-analytics"
            onClick={() => navigate('/statistics')}
          >
            <div className="action-content">
              <div className="action-icon-wrapper">
                <BarChart3 className="action-icon" />
              </div>
              <div className="action-text">
                <h3 className="action-title">Analytiques Avancées</h3>
                <p className="action-description">Graphiques détaillés et tendances</p>
              </div>
              <ArrowRight className="action-arrow" />
            </div>
            <div className="action-glow"></div>
          </div>

          <div 
            className="quick-action action-insights"
            onClick={() => navigate('/ai-insights')}
          >
            <div className="action-content">
              <div className="action-icon-wrapper">
                <Lightbulb className="action-icon" />
              </div>
              <div className="action-text">
                <h3 className="action-title">Insights IA</h3>
                <p className="action-description">Recommandations personnalisées</p>
              </div>
              <ArrowRight className="action-arrow" />
            </div>
            <div className="action-glow"></div>
          </div>

          <div 
            className="quick-action action-patients"
            onClick={() => navigate('/therapist/patients')}
          >
            <div className="action-content">
              <div className="action-icon-wrapper">
                <FileText className="action-icon" />
              </div>
              <div className="action-text">
                <h3 className="action-title">Gestion des Patients</h3>
                <p className="action-description">Liste complète et gestion</p>
              </div>
              <ArrowRight className="action-arrow" />
            </div>
            <div className="action-glow"></div>
          </div>
        </div>

        {/* AI CTA */}
        <div className="ai-cta">
          <div className="ai-cta-content">
            <div className="ai-cta-text">
              <div className="ai-header">
                <Sparkles className="ai-icon" />
                <h3 className="ai-title">Analyse IA des Progrès</h3>
              </div>
              <p className="ai-description">
                Obtenez des insights détaillés sur les progrès de vos patients avec notre intelligence artificielle avancée
              </p>
            </div>
            <button 
              onClick={() => navigate('/ai-insights')}
              className="btn btn-ai"
            >
              <Brain className="btn-icon" />
              Explorer les analyses
            </button>
          </div>
          <div className="ai-glow"></div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
          animation: fadeIn 0.8s ease-out;
        }

        /* Header */
        .dashboard-header {
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .dashboard-header {
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
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .welcome-emoji {
          display: inline-block;
          animation: wave 2s ease-in-out infinite;
          font-size: 2.2rem;
        }

        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          75% { transform: rotate(-10deg); }
        }

        .therapist-name {
          color: #1e40af;
        }

        .dashboard-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-with-icon {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 1rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
        }

        .btn-with-icon:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
        }

        .btn-secondary {
          background: #f8fafc;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }

        .btn-icon {
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

        .stat-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon-wrapper {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-icon {
          width: 1.75rem;
          height: 1.75rem;
        }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #111827;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .percent {
          font-size: 1.5rem;
          color: #6b7280;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #16a34a;
          font-weight: 500;
        }

        .trend-icon {
          width: 0.875rem;
          height: 0.875rem;
        }

        .stat-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          background: radial-gradient(circle at top right, var(--glow-color), transparent 70%);
        }

        .stat-card:hover .stat-glow {
          opacity: 0.15;
        }

        .stat-primary {
          --glow-color: #3b82f6;
        }

        .stat-primary .stat-icon-wrapper {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }

        .stat-primary .stat-icon {
          color: #1d4ed8;
        }

        .stat-success {
          --glow-color: #10b981;
        }

        .stat-success .stat-icon-wrapper {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        }

        .stat-success .stat-icon {
          color: #15803d;
        }

        .stat-warning {
          --glow-color: #f59e0b;
        }

        .stat-warning .stat-icon-wrapper {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
        }

        .stat-warning .stat-icon {
          color: #d97706;
        }

        .stat-info {
          --glow-color: #8b5cf6;
        }

        .stat-info .stat-icon-wrapper {
          background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
        }

        .stat-info .stat-icon {
          color: #7c3aed;
        }

        /* Empty Dashboard */
        .empty-dashboard {
          background: white;
          border-radius: 2rem;
          padding: 4rem 2rem;
          text-align: center;
          border: 1px solid #e5e7eb;
          margin-bottom: 3rem;
          position: relative;
          overflow: hidden;
        }

        .empty-illustration {
          position: relative;
          width: 12rem;
          height: 12rem;
          margin: 0 auto 2rem;
        }

        .illustration-background {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          border-radius: 50%;
          animation: pulse 4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }

        .empty-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 5rem;
          height: 5rem;
          color: #9ca3af;
        }

        .empty-content {
          position: relative;
          z-index: 2;
        }

        .empty-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 1rem;
        }

        .empty-description {
          font-size: 1.125rem;
          color: #6b7280;
          margin-bottom: 2rem;
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .empty-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-lg {
          padding: 1rem 2rem;
          font-size: 1.125rem;
          border-radius: 1rem;
        }

        /* Dashboard Sections */
        .dashboard-section {
          margin-bottom: 3rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #4f46e5;
        }

        .section-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4f46e5;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .section-link:hover {
          gap: 0.75rem;
        }

        .link-icon {
          width: 1rem;
          height: 1rem;
        }

        /* Patients Grid */
        .patients-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .patients-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .dashboard-section {
            grid-column: span 2;
          }
          .dashboard-sidebar {
            grid-column: span 1;
          }
        }

        .patient-card {
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          animation: fadeInUp 0.6s ease-out backwards;
          position: relative;
          overflow: hidden;
        }

        .patient-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #bfdbfe;
        }

        .patient-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }

        .patient-card:hover::before {
          transform: scaleX(1);
        }

        .patient-header {
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

        .patient-details {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .patient-age, .patient-gender {
          font-size: 0.875rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
        }

        .patient-level {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          text-transform: capitalize;
        }

        .patient-level-léger {
          background: #dcfce7;
          color: #15803d;
        }

        .patient-level-modéré {
          background: #fef3c7;
          color: #d97706;
        }

        .patient-level-sévère {
          background: #fee2e2;
          color: #dc2626;
        }

        .patient-progress {
          margin-bottom: 1.5rem;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .progress-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .progress-value {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .progress-bar {
          width: 100%;
          height: 0.75rem;
          background: #f3f4f6;
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          border-radius: 9999px;
          position: relative;
          transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .patient-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.5rem;
          border-top: 1px solid #f3f4f6;
        }

        .activity-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .activity-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .alert-icon {
          width: 1rem;
          height: 1rem;
          color: #ef4444;
        }

        .check-icon {
          width: 1rem;
          height: 1rem;
          color: #16a34a;
        }

        .activity-time {
          color: #9ca3af;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
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

        /* Sidebar */
        .dashboard-sidebar {
          margin-bottom: 3rem;
        }

        @media (min-width: 1280px) {
          .dashboard-section, .dashboard-sidebar {
            display: contents;
          }
          
          .dashboard-section {
            grid-column: 1 / 3;
          }
          
          .dashboard-sidebar {
            grid-column: 3 / 4;
            grid-row: 2;
          }
        }

        .sidebar-card {
          background: white;
          border-radius: 1.5rem;
          border: 1px solid #e5e7eb;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .activity-card {
          padding: 1.5rem;
        }

        .card-header {
          margin-bottom: 1.5rem;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .card-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #4f46e5;
        }

        .empty-activity {
          text-align: center;
          padding: 2rem;
        }

        .empty-activity .empty-icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 1rem;
          color: #d1d5db;
        }

        .empty-text {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 1rem;
          animation: fadeIn 0.3s ease-out backwards;
          transition: all 0.2s ease;
        }

        .activity-item:hover {
          background: #f3f4f6;
          transform: translateX(4px);
        }

        .activity-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .activity-patient {
          font-size: 0.875rem;
          font-weight: 600;
          color: #111827;
        }

        .activity-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .emotion-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .intensity-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .intensity-track {
          flex: 1;
          height: 0.375rem;
          background: #e5e7eb;
          border-radius: 9999px;
          overflow: hidden;
        }

        .intensity-level {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        .intensity-value {
          font-size: 0.75rem;
          color: #6b7280;
          min-width: 2rem;
        }

        .activity-context {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .stats-card {
          padding: 1.5rem;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .quick-stat {
          text-align: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 1rem;
          transition: all 0.2s ease;
        }

        .quick-stat:hover {
          background: #f3f4f6;
          transform: translateY(-2px);
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.2;
        }

        /* Quick Actions */
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 768px) {
          .quick-actions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .quick-action {
          position: relative;
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .quick-action:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .action-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .action-icon-wrapper {
          width: 3rem;
          height: 3rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .quick-action:hover .action-icon-wrapper {
          transform: scale(1.1) rotate(10deg);
        }

        .action-icon {
          width: 1.5rem;
          height: 1.5rem;
        }

        .action-text {
          flex: 1;
        }

        .action-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .action-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .action-arrow {
          width: 1.25rem;
          height: 1.25rem;
          color: #9ca3af;
          transition: all 0.3s ease;
        }

        .quick-action:hover .action-arrow {
          color: #4f46e5;
          transform: translateX(4px);
        }

        .action-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          background: radial-gradient(circle at center, var(--action-glow), transparent 70%);
        }

        .quick-action:hover .action-glow {
          opacity: 0.1;
        }

        .action-analytics {
          --action-glow: #3b82f6;
        }

        .action-analytics .action-icon-wrapper {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }

        .action-analytics .action-icon {
          color: #1d4ed8;
        }

        .action-insights {
          --action-glow: #a855f7;
        }

        .action-insights .action-icon-wrapper {
          background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
        }

        .action-insights .action-icon {
          color: #7c3aed;
        }

        .action-patients {
          --action-glow: #10b981;
        }

        .action-patients .action-icon-wrapper {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        }

        .action-patients .action-icon {
          color: #15803d;
        }

        /* AI CTA */
        .ai-cta {
          position: relative;
          background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
          border-radius: 2rem;
          padding: 2rem;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(13, 148, 136, 0.2);
        }

        .ai-glow {
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

        .ai-header {
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

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
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
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-ai:hover {
          background: #f0fdfa;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
};

export default TherapistDashboard;