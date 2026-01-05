// src/pages/EmotionsPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import childService from '../services/childService';
import emotionService from '../services/emotionService';
import Layout from '../components/dashboard/Layout';
import Card from '../components/common/card';
import Loading from '../components/common/loading';
import EmotionBadge from '../components/common/emotionBadge';
import EmotionStats from '../components/emotions/EmotionStats';
import Button from '../components/common/button';
import { 
  Plus, 
  Filter,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EmotionsPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('childId');

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(preselectedChildId || '');
  const [emotions, setEmotions] = useState([]);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState(30);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    emotion: '',
    source: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchEmotions();
      fetchStats();
    }
  }, [selectedChild, period, filters]);

  const fetchChildren = async () => {
    try {
      const response = await childService.getAllChildren();
      setChildren(response.data);
      if (response.data.length > 0 && !selectedChild) {
        setSelectedChild(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Erreur lors du chargement des enfants');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmotions = async () => {
    try {
      const params = {
        limit: 50,
        ...filters
      };
      const response = await emotionService.getEmotionsByChild(selectedChild, params);
      setEmotions(response.data);
    } catch (error) {
      console.error('Error fetching emotions:', error);
      toast.error('Erreur lors du chargement des émotions');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await emotionService.getEmotionStats(selectedChild, period);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddEmotion = () => {
    setShowAddModal(true);
  };

  const getSourceLabel = (source) => {
    const labels = {
      camera_nlp: 'Caméra NLP',
      game: 'Jeu',
      manual: 'Manuel',
      parent_observation: 'Observation parent'
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement..." />
      </Layout>
    );
  }

  if (children.length === 0) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              Vous devez d'abord ajouter un enfant pour suivre ses émotions
            </p>
            <Button onClick={() => window.location.href = '/children/new'}>
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un enfant
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  const selectedChildData = children.find(c => c._id === selectedChild);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Suivi des émotions
            </h1>
            <p className="mt-1 text-gray-600">
              Analysez les émotions de vos enfants
            </p>
          </div>
          <Button onClick={handleAddEmotion}>
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une émotion
          </Button>
        </div>

        {/* Sélection enfant et période */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un enfant
              </label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.firstName} {child.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={7}>7 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={90}>90 derniers jours</option>
                <option value={365}>1 an</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Statistiques */}
        {stats && <EmotionStats stats={stats} />}

        {/* Liste des émotions récentes */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Émotions récentes
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchEmotions}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.emotion}
                onChange={(e) => setFilters({ ...filters, emotion: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Toutes les émotions</option>
                <option value="joie">Joie</option>
                <option value="tristesse">Tristesse</option>
                <option value="colère">Colère</option>
                <option value="peur">Peur</option>
                <option value="surprise">Surprise</option>
                <option value="neutre">Neutre</option>
                <option value="dégoût">Dégoût</option>
              </select>

              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Toutes les sources</option>
                <option value="camera_nlp">Caméra NLP</option>
                <option value="game">Jeu</option>
                <option value="manual">Manuel</option>
                <option value="parent_observation">Observation</option>
              </select>

              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Date début"
              />

              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Date fin"
              />
            </div>
          </div>

          {/* Timeline des émotions */}
          {emotions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Aucune émotion enregistrée</p>
              <Button onClick={handleAddEmotion} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter la première émotion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {emotions.map((emotion) => (
                <div
                  key={emotion._id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-primary-600 rounded-full" />
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <EmotionBadge emotion={emotion.emotion} />
                        <span className="text-xs text-gray-500">
                          {getSourceLabel(emotion.source)}
                        </span>
                        {emotion.confidence && (
                          <span className="text-xs text-gray-500">
                            Confiance: {emotion.confidence}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(emotion.timestamp), 'PPp', { locale: fr })}
                      </div>
                    </div>

                    {emotion.context && (
                      <p className="text-sm text-gray-700 mb-2">
                        {emotion.context}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {emotion.intensity && (
                        <span>Intensité: {emotion.intensity}/5</span>
                      )}
                      {emotion.duration && (
                        <span>Durée: {emotion.duration} min</span>
                      )}
                      {emotion.location && (
                        <span className="capitalize">{emotion.location}</span>
                      )}
                    </div>

                    {emotion.triggers && emotion.triggers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {emotion.triggers.map((trigger, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {trigger}
                          </span>
                        ))}
                      </div>
                    )}

                    {emotion.notes && (
                      <p className="mt-2 text-xs text-gray-600 italic">
                        Note: {emotion.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default EmotionsPage;