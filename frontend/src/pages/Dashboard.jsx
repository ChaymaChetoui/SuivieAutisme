// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import childService from '../services/childService';
import emotionService from '../services/emotionService';
import Layout from '../components/dashboard/Layout';
import Card from '../components/common/card';
import Loading from '../components/common/loading';
import EmotionBadge from '../components/common/emotionBadge';
import { 
  Users, 
  Heart, 
  TrendingUp, 
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
  Activity,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalEmotions: 0,
    emotionsThisWeek: 0,
    recentEmotions: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const childrenResponse = await childService.getAllChildren();
      setChildren(childrenResponse.data);

      let totalEmotions = 0;
      let emotionsThisWeek = 0;
      const allRecentEmotions = [];
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const child of childrenResponse.data) {
        try {
          const emotionsResponse = await emotionService.getEmotionsByChild(child._id, { limit: 10 });
          const emotions = emotionsResponse.data;
          
          totalEmotions += emotionsResponse.pagination?.total || emotions.length;
          
          const thisWeekEmotions = emotions.filter(e => 
            new Date(e.timestamp) >= oneWeekAgo
          );
          emotionsThisWeek += thisWeekEmotions.length;
          
          allRecentEmotions.push(...emotions.slice(0, 5).map(e => ({
            ...e,
            childName: `${child.firstName} ${child.lastName}`
          })));
        } catch (error) {
          console.error(`Error fetching emotions for child ${child._id}:`, error);
        }
      }

      setStats({
        totalChildren: childrenResponse.data.length,
        totalEmotions,
        emotionsThisWeek,
        recentEmotions: allRecentEmotions.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        ).slice(0, 8)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        {/* Header avec animation */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="greeting-section">
              <h1 className="dashboard-title">
                <span className="wave-emoji">👋</span>
                Bonjour, {user?.profile?.firstName || 'Parent'}
              </h1>
              <p className="dashboard-subtitle">
                Voici un aperçu serein de la journée de vos enfants
              </p>
            </div>
            <Link to="/children/new" className="add-child-link">
              <button className="btn btn-primary btn-with-icon">
                <Plus className="icon" />
                <span>Ajouter un enfant</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Cards avec animations au scroll */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Enfants suivis</p>
                <p className="stat-value">{stats.totalChildren}</p>
                <div className="stat-trend">
                  <Activity className="trend-icon" />
                  <span>Actifs aujourd'hui</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-blue">
                <Users className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-blue"></div>
          </div>

          <div className="stat-card stat-card-pink">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Émotions totales</p>
                <p className="stat-value">{stats.totalEmotions}</p>
                <div className="stat-trend">
                  <TrendingUp className="trend-icon" />
                  <span>+12% ce mois</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-pink">
                <Heart className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-pink"></div>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Cette semaine</p>
                <p className="stat-value">{stats.emotionsThisWeek}</p>
                <div className="stat-trend">
                  <BarChart3 className="trend-icon" />
                  <span>7 derniers jours</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-green">
                <TrendingUp className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-green"></div>
          </div>

          <div className="stat-card stat-card-purple">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Jours actifs</p>
                <p className="stat-value">7</p>
                <div className="stat-trend">
                  <Calendar className="trend-icon" />
                  <span>Suivi continu</span>
                </div>
              </div>
              <div className="stat-icon-wrapper stat-icon-purple">
                <Calendar className="stat-icon" />
              </div>
            </div>
            <div className="stat-card-glow stat-glow-purple"></div>
          </div>
        </div>

        <div className="content-grid">
          {/* Liste des enfants */}
          <div className="content-card children-card">
            <div className="card-header">
              <h2 className="card-title">Mes enfants</h2>
              <Link to="/children" className="view-all-link">
                Voir tout <ArrowRight className="link-icon" />
              </Link>
            </div>

            {children.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <Users className="empty-icon" />
                </div>
                <p className="empty-text">Aucun enfant enregistré pour le moment</p>
                <Link to="/children/new">
                  <button className="btn btn-primary btn-with-icon">
                    <Plus className="icon" />
                    Ajouter mon premier enfant
                  </button>
                </Link>
              </div>
            ) : (
              <div className="children-list">
                {children.map((child, index) => (
                  <Link
                    key={child._id}
                    to={`/children/${child._id}`}
                    className="child-item"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="child-content">
                      <div className="child-avatar">
                        {child.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div className="child-info">
                        <h3 className="child-name">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="child-details">
                          {child.age} ans • Niveau {child.autismLevel}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="child-arrow" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Émotions récentes */}
          <div className="content-card emotions-card">
            <div className="card-header">
              <h2 className="card-title">Émotions récentes</h2>
              <Link to="/emotions" className="view-all-link">
                Voir tout <ArrowRight className="link-icon" />
              </Link>
            </div>

            {stats.recentEmotions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <Heart className="empty-icon" />
                </div>
                <p className="empty-text">Aucune émotion enregistrée récemment</p>
              </div>
            ) : (
              <div className="emotions-list">
                {stats.recentEmotions.map((emotion, index) => (
                  <div
                    key={emotion._id}
                    className="emotion-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="emotion-content">
                      <EmotionBadge emotion={emotion.emotion} size="lg" />
                      <div className="emotion-info">
                        <p className="emotion-child">{emotion.childName}</p>
                        <p className="emotion-context">
                          {emotion.context || 'Sans contexte précisé'}
                        </p>
                      </div>
                    </div>
                    <span className="emotion-time">
                      {formatDate(emotion.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Call to action IA */}
        <div className="ai-cta-card">
          <div className="ai-cta-background"></div>
          <div className="ai-cta-content">
            <div className="ai-cta-text">
              <div className="ai-cta-header">
                <Sparkles className="ai-icon" />
                <h3 className="ai-title">Insights par Intelligence Artificielle</h3>
              </div>
              <p className="ai-description">
                Découvrez des analyses personnalisées, des tendances émotionnelles et des recommandations adaptées pour mieux accompagner votre enfant.
              </p>
            </div>
            <Link to="/ai-insights">
              <button className="btn btn-ai">
                Explorer les insights
              </button>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
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

        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(0deg); }
        }

        .dashboard-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          font-weight: 400;
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
          padding: 2rem;
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
          font-size: 3rem;
          font-weight: 800;
          color: #111827;
          line-height: 1;
          margin-bottom: 1rem;
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
          width: 4rem;
          height: 4rem;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-icon {
          width: 2rem;
          height: 2rem;
        }

        .stat-icon-blue {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        }

        .stat-icon-blue .stat-icon {
          color: #1d4ed8;
        }

        .stat-icon-pink {
          background: linear-gradient(135deg, #fce7f3, #fbcfe8);
        }

        .stat-icon-pink .stat-icon {
          color: #be185d;
        }

        .stat-icon-green {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        }

        .stat-icon-green .stat-icon {
          color: #15803d;
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

        .stat-glow-pink {
          background: radial-gradient(circle at top right, #ec4899, transparent);
        }

        .stat-glow-green {
          background: radial-gradient(circle at top right, #22c55e, transparent);
        }

        .stat-glow-purple {
          background: radial-gradient(circle at top right, #a855f7, transparent);
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .content-card {
          background: white;
          border-radius: 1.5rem;
          padding: 2rem;
          border: 1px solid #e5e7eb;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 0.6s ease-out 0.5s backwards;
        }

        .content-card:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        .view-all-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2563eb;
          transition: all 0.2s ease;
        }

        .view-all-link:hover {
          color: #1d4ed8;
          gap: 0.75rem;
        }

        .link-icon {
          width: 1rem;
          height: 1rem;
          transition: transform 0.2s ease;
        }

        .view-all-link:hover .link-icon {
          transform: translateX(4px);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon-wrapper {
          width: 5rem;
          height: 5rem;
          margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-icon {
          width: 2.5rem;
          height: 2.5rem;
          color: #9ca3af;
        }

        .empty-text {
          font-size: 1.125rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        /* Children List */
        .children-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .child-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          border-radius: 1.25rem;
          border: 1px solid #e5e7eb;
          background: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideInLeft 0.4s ease-out backwards;
        }

        .child-item:hover {
          border-color: #bfdbfe;
          background: linear-gradient(135deg, #eff6ff, white);
          transform: translateX(8px);
        }

        .child-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
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

export default Dashboard;