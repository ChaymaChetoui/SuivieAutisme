// src/pages/AdvancedStatistics.jsx
import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Layout from '../components/dashboard/Layout';
import Loading from '../components/common/loading';
import EmotionBadge from '../components/common/emotionBadge';
import childService from '../services/childService';
import emotionService from '../services/emotionService';
import { Calendar, TrendingUp, TrendingDown, Activity, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const AdvancedStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [timeRange, setTimeRange] = useState('30');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState('7');
  
  const [data, setData] = useState({
    timeline: [],
    heatmap: [],
    emotionDistribution: [],
    trends: {},
    comparison: null
  });

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchStatistics();
    }
  }, [selectedChild, timeRange, comparisonMode, comparisonPeriod]);

  const fetchChildren = async () => {
    try {
      const response = await childService.getAllChildren();
      setChildren(response.data);
      if (response.data.length > 0) {
        setSelectedChild(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!selectedChild) return;

    try {
      setLoading(true);

      // Récupérer les données
      const [timelineData, stats] = await Promise.all([
        emotionService.getEmotionTimeline(selectedChild),
        emotionService.getEmotionStats(selectedChild, timeRange)
      ]);

      // Préparer timeline
      const timeline = prepareTimelineData(timelineData.data);
      
      // Préparer distribution
      const distribution = stats.data.statistics.byEmotion?.map(item => ({
        emotion: item._id,
        count: item.count,
        avgIntensity: item.avgIntensity || 0
      })) || [];

      // Calculer les tendances
      const trends = calculateTrends(timeline);

      // Si mode comparaison, récupérer les données de la période précédente
      let comparison = null;
      if (comparisonMode) {
        comparison = await fetchComparisonData();
      }

      setData({
        timeline,
        emotionDistribution: distribution,
        trends,
        comparison
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const prepareTimelineData = (rawData) => {
    // Grouper par date
    const grouped = {};
    
    rawData.forEach(item => {
      const date = item._id.date;
      if (!grouped[date]) {
        grouped[date] = {
          date,
          joie: 0,
          tristesse: 0,
          colère: 0,
          peur: 0,
          surprise: 0,
          neutre: 0,
          total: 0
        };
      }
      grouped[date][item._id.emotion] = item.count;
      grouped[date].total += item.count;
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  const calculateTrends = (timeline) => {
    if (timeline.length < 2) return {};

    const latest = timeline[timeline.length - 1];
    const previous = timeline[timeline.length - 2];

    const trends = {};
    ['joie', 'tristesse', 'colère', 'peur'].forEach(emotion => {
      const change = latest[emotion] - previous[emotion];
      const percentChange = previous[emotion] > 0 
        ? ((change / previous[emotion]) * 100).toFixed(1)
        : 0;
      
      trends[emotion] = {
        change,
        percentChange,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    });

    return trends;
  };

  const fetchComparisonData = async () => {
    // TODO: Implémenter la logique de comparaison
    return {
      previousPeriod: [],
      improvement: 15,
      emotionChanges: {}
    };
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      joie: '#fbbf24',
      tristesse: '#60a5fa',
      colère: '#ef4444',
      peur: '#a78bfa',
      surprise: '#f472b6',
      neutre: '#9ca3af'
    };
    return colors[emotion] || '#9ca3af';
  };

  if (loading && !selectedChild) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement..." />
      </Layout>
    );
  }

  const selectedChildData = children.find(c => c._id === selectedChild);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Statistiques Avancées
            </h1>
            <p className="mt-1 text-gray-600">
              Analyse détaillée des émotions
            </p>
          </div>
          <button className="btn btn-outline">
            <Download className="w-5 h-5 mr-2" />
            Exporter PDF
          </button>
        </div>

        {/* Filtres */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Sélectionner un enfant</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="input"
              >
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.firstName} {child.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Période d'analyse</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input"
              >
                <option value="7">7 derniers jours</option>
                <option value="30">30 derniers jours</option>
                <option value="90">90 derniers jours</option>
                <option value="180">6 mois</option>
                <option value="365">1 an</option>
              </select>
            </div>

            <div>
              <label className="label">Mode comparaison</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Comparer avec période précédente</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tendances principales */}
        {data.trends && Object.keys(data.trends).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.trends).map(([emotion, trend]) => (
              <div key={emotion} className="card">
                <div className="flex items-center justify-between mb-2">
                  <EmotionBadge emotion={emotion} size="sm" />
                  {trend.direction === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : trend.direction === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <Activity className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {trend.change > 0 ? '+' : ''}{trend.change}
                </p>
                <p className="text-sm text-gray-600">
                  {trend.percentChange}% vs période précédente
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Timeline des émotions */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Évolution temporelle
          </h2>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <Loading text="Chargement du graphique..." />
            </div>
          ) : data.timeline.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Aucune donnée disponible pour cette période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                />
                <Legend />
                <Area type="monotone" dataKey="joie" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.6} />
                <Area type="monotone" dataKey="tristesse" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} />
                <Area type="monotone" dataKey="colère" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                <Area type="monotone" dataKey="peur" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribution et intensité */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique Radar */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Profil émotionnel
            </h2>
            {data.emotionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.emotionDistribution}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="emotion" />
                  <PolarRadiusAxis />
                  <Radar 
                    name="Fréquence" 
                    dataKey="count" 
                    stroke="#0ea5e9" 
                    fill="#0ea5e9" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Aucune donnée
              </div>
            )}
          </div>

          {/* Liste détaillée */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Analyse détaillée
            </h2>
            <div className="space-y-4">
              {data.emotionDistribution.map((item) => (
                <div key={item.emotion} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <EmotionBadge emotion={item.emotion} size="sm" />
                    <span className="text-sm font-medium text-gray-900">
                      {item.count} occurrences
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Intensité moyenne</span>
                      <span>{item.avgIntensity.toFixed(1)}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${(item.avgIntensity / 5) * 100}%`,
                          background: getEmotionColor(item.emotion)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights et recommandations */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}>
          <div className="text-white">
            <h2 className="text-xl font-bold mb-3">💡 Insights IA</h2>
            <p className="mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Obtenez des analyses personnalisées et des recommandations basées sur l'IA
            </p>
            <button className="btn btn-secondary">
              Générer des insights
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdvancedStatistics;
