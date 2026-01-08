// src/pages/ChildProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/dashboard/Layout';
import Loading from '../components/common/loading';
import EmotionBadge from '../components/common/emotionBadge';
import childService from '../services/childService';
import emotionService from '../services/emotionService';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Activity,
  TrendingUp,
  Heart,
  Plus,
  FileText,
  AlertCircle,
  Pill
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ChildProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchChildData();
  }, [id]);

  const fetchChildData = async () => {
    try {
      setLoading(true);
      const [childData, dashboardData] = await Promise.all([
        childService.getChildById(id),
        childService.getChildDashboard(id)
      ]);
      
      setChild(childData.data);
      setDashboard(dashboardData.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement');
      navigate('/children');
    } finally {
      setLoading(false);
    }
  };

  const getAutismLevelColor = (level) => {
    switch (level) {
      case 'léger': return { bg: '#dcfce7', text: '#166534' };
      case 'modéré': return { bg: '#fef9c3', text: '#854d0e' };
      case 'sévère': return { bg: '#fee2e2', text: '#7f1d1d' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const EMOTION_COLORS = {
    joie: '#fbbf24',
    tristesse: '#60a5fa',
    colère: '#ef4444',
    peur: '#a78bfa',
    surprise: '#f472b6',
    neutre: '#9ca3af',
    dégoût: '#84cc16'
  };

  if (loading) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement du profil..." />
      </Layout>
    );
  }

  if (!child) {
    return null;
  }

  const levelColors = getAutismLevelColor(child.autismLevel);
  const pieData = dashboard?.statistics?.emotions?.distribution?.map(item => ({
    name: item._id,
    value: item.count,
    color: EMOTION_COLORS[item._id]
  })) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/children')}
              className="btn btn-ghost p-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {child.firstName} {child.lastName}
              </h1>
              <p className="mt-1 text-gray-600">
                {child.age} ans • {child.gender === 'male' ? 'Garçon' : 'Fille'}
              </p>
            </div>
          </div>
          <Link to={`/children/${id}/edit`}>
            <button className="btn btn-primary">
              <Edit className="w-5 h-5 mr-2" />
              Modifier
            </button>
          </Link>
        </div>

        {/* Carte profil */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-5xl"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}
              >
                {child.firstName.charAt(0)}{child.lastName.charAt(0)}
              </div>
            </div>

            {/* Infos principales */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Date de naissance</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {format(new Date(child.dateOfBirth), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Niveau d'autisme</label>
                <div className="mt-1">
                  <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{ background: levelColors.bg, color: levelColors.text }}
                  >
                    Autisme {child.autismLevel}
                  </span>
                </div>
              </div>

              {child.diagnosticDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Date du diagnostic</label>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {format(new Date(child.diagnosticDate), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Suivi depuis</label>
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {format(new Date(child.createdAt), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Émotions totales</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {dashboard?.statistics?.emotions?.total || 0}
                </p>
              </div>
              <Heart className="w-12 h-12 text-red-500" style={{ opacity: 0.2 }} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions de jeu</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {dashboard?.statistics?.games?.totalSessions || 0}
                </p>
              </div>
              <Activity className="w-12 h-12 text-blue-500" style={{ opacity: 0.2 }} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score moyen</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {dashboard?.statistics?.games?.avgScore?.toFixed(0) || 0}%
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" style={{ opacity: 0.2 }} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Précision</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {dashboard?.statistics?.games?.avgAccuracy?.toFixed(0) || 0}%
                </p>
              </div>
              <Activity className="w-12 h-12 text-purple-500" style={{ opacity: 0.2 }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-4">
            {['overview', 'emotions', 'medical', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'overview' && 'Vue d\'ensemble'}
                {tab === 'emotions' && 'Émotions'}
                {tab === 'medical' && 'Médical'}
                {tab === 'reports' && 'Rapports'}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des tabs */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution des émotions */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Distribution des émotions
              </h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Émotions récentes */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Émotions récentes
                </h2>
                <Link to={`/emotions?childId=${id}`} className="text-primary text-sm font-medium">
                  Voir tout
                </Link>
              </div>

              <div className="space-y-3">
                {dashboard?.statistics?.recentEmotions?.slice(0, 5).map((emotion) => (
                  <div
                    key={emotion._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <EmotionBadge emotion={emotion.emotion} size="sm" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {emotion.context || 'Sans contexte'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(emotion.timestamp), 'PPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    {emotion.intensity && (
                      <span className="text-xs text-gray-600">
                        {emotion.intensity}/5
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <Link to={`/emotions/new?childId=${id}`}>
                <button className="btn btn-outline w-full mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une émotion
                </button>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'emotions' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Historique complet des émotions
              </h2>
              <Link to={`/statistics?childId=${id}`}>
                <button className="btn btn-primary">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistiques détaillées
                </button>
              </Link>
            </div>
            <p className="text-gray-600">
              Voir toutes les émotions et statistiques dans la section dédiée
            </p>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-6">
            {/* Notes médicales */}
            {child.medicalNotes && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Notes médicales
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {child.medicalNotes}
                </p>
              </div>
            )}

            {/* Allergies */}
            {child.allergies && child.allergies.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Allergies
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {child.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="badge badge-danger"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Médicaments */}
            {child.medications && child.medications.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Médicaments
                  </h2>
                </div>
                <div className="space-y-3">
                  {child.medications.map((med, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      {med.dosage && (
                        <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                      )}
                      {med.frequency && (
                        <p className="text-sm text-gray-600">Fréquence: {med.frequency}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Besoins spéciaux */}
            {child.specialNeeds && child.specialNeeds.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Besoins spéciaux
                </h2>
                <div className="flex flex-wrap gap-2">
                  {child.specialNeeds.map((need, index) => (
                    <span
                      key={index}
                      className="badge badge-primary"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Rapports de progression
            </h2>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Générez des rapports détaillés avec l'IA
              </p>
              <Link to={`/ai-insights?childId=${id}`}>
                <button className="btn btn-primary">
                  <Brain className="w-5 h-5 mr-2" />
                  Générer un rapport IA
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChildProfile;