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
import { Plus, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import '../styles/emotions-page.css';

const EmotionsPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('childId');

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(preselectedChildId || '');
  const [emotions, setEmotions] = useState([]);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState(30);
  const [filters, setFilters] = useState({
    emotion: '',
    source: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => { fetchChildren(); }, []);
  useEffect(() => { 
    if (selectedChild) { fetchEmotions(); fetchStats(); }
  }, [selectedChild, period, filters]);

  const fetchChildren = async () => {
    try {
      const res = await childService.getAllChildren();
      setChildren(res.data);
      if (res.data.length > 0 && !selectedChild) setSelectedChild(res.data[0]._id);
    } catch {
      toast.error('Erreur lors du chargement des enfants');
    } finally { setLoading(false); }
  };

  const fetchEmotions = async () => {
    try {
      const params = { limit: 50, ...filters };
      const res = await emotionService.getEmotionsByChild(selectedChild, params);
      setEmotions(res.data);
    } catch {
      toast.error('Erreur lors du chargement des émotions');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await emotionService.getEmotionStats(selectedChild, period);
      setStats(res.data);
    } catch {}
  };

  const handleAddEmotion = () => { toast('Ajouter une émotion (à implémenter)'); };
  const getSourceLabel = (source) => ({
    camera_nlp: 'Caméra NLP',
    game: 'Jeu',
    manual: 'Manuel',
    parent_observation: 'Observation parent'
  }[source] || source);

  if (loading) return <Layout><Loading fullScreen text="Chargement..." /></Layout>;
  if (children.length === 0) return (
    <Layout>
      <Card className="text-center py-12">
        <p className="text-gray-600 mb-4">Vous devez d'abord ajouter un enfant pour suivre ses émotions</p>
        <Button onClick={() => window.location.href='/children/new'}>
          <Plus className="w-5 h-5 mr-2" /> Ajouter un enfant
        </Button>
      </Card>
    </Layout>
  );

  return (
    <Layout>
      <div className="emotions-page">

        <div className="emotions-header">
          <h1>Suivi des émotions</h1>
          <Button onClick={handleAddEmotion}><Plus /> Ajouter une émotion</Button>
        </div>

        {/* Child selection & period */}
        <Card className="filters-card">
          <div className="filters-grid">
            <div>
              <label>Sélectionner un enfant</label>
              <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                {children.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label>Période</label>
              <select value={period} onChange={e => setPeriod(Number(e.target.value))}>
                <option value={7}>7 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={90}>90 derniers jours</option>
                <option value={365}>1 an</option>
              </select>
            </div>
          </div>
        </Card>

        {stats && <EmotionStats stats={stats} />}

        <Card className="emotions-list-card">
          <div className="emotions-list-header">
            <h2>Émotions récentes</h2>
            <div className="emotions-list-actions">
              <Button variant="outline" size="sm" onClick={fetchEmotions}><RefreshCw /> Actualiser</Button>
              <Button variant="outline" size="sm"><Download /> Exporter</Button>
            </div>
          </div>

          {emotions.length === 0 ? (
            <div className="no-emotions">
              <p>Aucune émotion enregistrée</p>
              <Button onClick={handleAddEmotion}><Plus /> Ajouter la première émotion</Button>
            </div>
          ) : (
            <div className="emotions-timeline">
              {emotions.map((e) => (
                <div key={e._id} className={`emotion-card emotion-${e.emotion}`}>
                  <div className="emotion-header">
                    <EmotionBadge emotion={e.emotion} />
                    <span className="emotion-source">{getSourceLabel(e.source)}</span>
                    <span className="emotion-date">{format(new Date(e.timestamp), 'PPp', {locale: fr})}</span>
                  </div>
                  {e.context && <p className="emotion-context">{e.context}</p>}
                  <div className="emotion-meta">
                    {e.intensity && <span>Intensité: {e.intensity}/5</span>}
                    {e.duration && <span>Durée: {e.duration} min</span>}
                    {e.location && <span>{e.location}</span>}
                  </div>
                  {e.triggers && e.triggers.length > 0 && (
                    <div className="emotion-triggers">
                      {e.triggers.map((t, i) => <span key={i}>{t}</span>)}
                    </div>
                  )}
                  {e.notes && <p className="emotion-notes">Note: {e.notes}</p>}
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
