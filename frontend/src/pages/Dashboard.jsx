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
  Sparkles
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

      // Calculer les stats
      let totalEmotions = 0;
      let emotionsThisWeek = 0;
      const allRecentEmotions = [];
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const child of childrenResponse.data) {
        try {
          const emotionsResponse = await emotionService.getEmotionsByChild(child._id, { limit: 10 });
          const emotions = emotionsResponse.data;
          
          totalEmotions += emotionsResponse.pagination?.total || 0;
          
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
        ).slice(0, 5)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour, {user?.profile?.firstName || 'Parent'} 👋
            </h1>
            <p className="mt-1 text-gray-600">
              Voici un aperçu de vos enfants aujourd'hui
            </p>
          </div>
          <Link to="/children/new">
            <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un enfant
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enfants</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalChildren}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Émotions totales</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalEmotions}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cette semaine</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.emotionsThisWeek}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jours actifs</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">7</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des enfants */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Mes enfants</h2>
              <Link to="/children" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Voir tout
              </Link>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucun enfant enregistré</p>
                <Link to="/children/new">
                  <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un enfant
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <Link
                    key={child._id}
                    to={`/children/${child._id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {child.firstName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {child.firstName} {child.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {child.age} ans • Autisme {child.autismLevel}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Émotions récentes */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Émotions récentes</h2>
              <Link to="/emotions" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Voir tout
              </Link>
            </div>

            {stats.recentEmotions.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune émotion enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentEmotions.map((emotion) => (
                  <div
                    key={emotion._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <EmotionBadge emotion={emotion.emotion} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {emotion.childName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {emotion.context || 'Sans contexte'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(emotion.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Call to action IA */}
        <Card className="bg-gradient-to-r from-primary-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-bold">Insights IA</h3>
              </div>
              <p className="text-primary-100">
                Découvrez des analyses personnalisées et des recommandations pour vos enfants
              </p>
            </div>
            <Link to="/ai-insights">
              <button className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors">
                Explorer
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;