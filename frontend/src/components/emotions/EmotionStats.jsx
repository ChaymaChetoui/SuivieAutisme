// src/components/emotions/EmotionStats.jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Card from '../common/card';
import EmotionBadge from '../common/emotionBadge';

const EMOTION_COLORS = {
  joie: '#fbbf24',
  tristesse: '#60a5fa',
  colère: '#ef4444',
  peur: '#a78bfa',
  surprise: '#f472b6',
  neutre: '#9ca3af',
  dégoût: '#84cc16'
};

const EmotionStats = ({ stats }) => {
  if (!stats || !stats.statistics) {
    return null;
  }

  const { statistics } = stats;
  
  // Préparer les données pour le pie chart
  const pieData = statistics.byEmotion?.map(item => ({
    name: item._id,
    value: item.count,
    color: EMOTION_COLORS[item._id] || '#9ca3af'
  })) || [];

  // Préparer les données pour le bar chart (intensité)
  const intensityData = statistics.byEmotion?.map(item => ({
    emotion: item._id,
    intensity: item.avgIntensity?.toFixed(1) || 0,
    count: item.count
  })) || [];

  const totalEmotions = statistics.overall?.[0]?.total || 0;
  const avgIntensity = statistics.overall?.[0]?.avgIntensity?.toFixed(1) || 0;

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total d'émotions
            </p>
            <p className="text-4xl font-bold text-gray-900">
              {totalEmotions}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.period}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Intensité moyenne
            </p>
            <p className="text-4xl font-bold text-gray-900">
              {avgIntensity}
              <span className="text-lg text-gray-500">/5</span>
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${(avgIntensity / 5) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Émotion dominante
            </p>
            {pieData[0] && (
              <div className="mt-2">
                <EmotionBadge emotion={pieData[0].name} size="lg" />
                <p className="text-sm text-gray-500 mt-2">
                  {((pieData[0].value / totalEmotions) * 100).toFixed(0)}% du total
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des émotions */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Distribution des émotions
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
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
        </Card>

        {/* Intensité par émotion */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Intensité moyenne par émotion
          </h3>
          {intensityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={intensityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="emotion" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="intensity" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Aucune donnée disponible
            </div>
          )}
        </Card>
      </div>

      {/* Liste détaillée */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Détails par émotion
        </h3>
        <div className="space-y-3">
          {statistics.byEmotion?.map((emotion) => (
            <div
              key={emotion._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <EmotionBadge emotion={emotion._id} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {emotion.count} occurrence{emotion.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((emotion.count / totalEmotions) * 100).toFixed(1)}% du total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Intensité: {emotion.avgIntensity?.toFixed(1) || 0}/5
                </p>
                {emotion.avgConfidence && (
                  <p className="text-xs text-gray-500">
                    Confiance: {emotion.avgConfidence.toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default EmotionStats;