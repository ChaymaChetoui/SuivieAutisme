// src/pages/AddEmotion.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/dashboard/Layout';
import Card from '../components/common/card';
import Input from '../components/common/input';
import Button from '../components/common/button';
import Loading from '../components/common/loading';
import childService from '../services/childService';
import emotionService from '../services/emotionService';
import { ArrowLeft, Save, Smile, Frown, Angry, AlertCircle, Sparkles, Meh, ThumbsDown } from 'lucide-react';
import toast from 'react-hot-toast';

const AddEmotion = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('childId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [children, setChildren] = useState([]);
  const [formData, setFormData] = useState({
    childId: preselectedChildId || '',
    emotion: '',
    source: 'parent_observation',
    intensity: 3,
    context: '',
    location: 'home',
    triggers: '',
    notes: '',
    duration: '',
    confidence: null
  });
  const [errors, setErrors] = useState({});

  const emotions = [
    { value: 'joie', label: 'Joie', icon: Smile, color: '#fbbf24', bg: '#fef9c3' },
    { value: 'tristesse', label: 'Tristesse', icon: Frown, color: '#60a5fa', bg: '#dbeafe' },
    { value: 'colère', label: 'Colère', icon: Angry, color: '#ef4444', bg: '#fee2e2' },
    { value: 'peur', label: 'Peur', icon: AlertCircle, color: '#a78bfa', bg: '#ede9fe' },
    { value: 'surprise', label: 'Surprise', icon: Sparkles, color: '#f472b6', bg: '#fce7f3' },
    { value: 'neutre', label: 'Neutre', icon: Meh, color: '#9ca3af', bg: '#f3f4f6' },
    { value: 'dégoût', label: 'Dégoût', icon: ThumbsDown, color: '#84cc16', bg: '#dcfce7' }
  ];

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childService.getAllChildren();
      setChildren(response.data || []);
      
      // Si un seul enfant et pas de présélection, le sélectionner automatiquement
      if (response.data?.length === 1 && !preselectedChildId) {
        setFormData(prev => ({ ...prev, childId: response.data[0]._id }));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEmotionSelect = (emotionValue) => {
    setFormData(prev => ({ ...prev, emotion: emotionValue }));
    if (errors.emotion) {
      setErrors(prev => ({ ...prev, emotion: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.childId) newErrors.childId = 'Veuillez sélectionner un enfant';
    if (!formData.emotion) newErrors.emotion = 'Veuillez sélectionner une émotion';
    if (!formData.source) newErrors.source = 'Source requise';
    if (!formData.intensity || formData.intensity < 1 || formData.intensity > 5) {
      newErrors.intensity = 'L\'intensité doit être entre 1 et 5';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    setSaving(true);
    try {
      // Préparer les données
      const emotionData = {
        ...formData,
        triggers: formData.triggers ? formData.triggers.split(',').map(t => t.trim()).filter(Boolean) : [],
        duration: formData.duration ? parseInt(formData.duration) : null,
        intensity: parseInt(formData.intensity),
        confidence: formData.confidence || null
      };

      await emotionService.createEmotion(emotionData);
      toast.success('Émotion enregistrée avec succès !');
      
      // Rediriger vers la page des émotions de l'enfant
      navigate(`/emotions?childId=${formData.childId}`);
    } catch (error) {
      console.error('Error saving emotion:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
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
        <div className="card text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun enfant enregistré
          </h3>
          <p className="text-gray-600 mb-6">
            Vous devez d'abord ajouter un enfant pour enregistrer des émotions
          </p>
          <button 
            onClick={() => navigate('/children/new')}
            className="btn btn-primary"
          >
            Ajouter un enfant
          </button>
        </div>
      </Layout>
    );
  }

  const selectedEmotion = emotions.find(e => e.value === formData.emotion);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Enregistrer une émotion
            </h1>
            <p className="mt-1 text-gray-600">
              Capturez l'état émotionnel de l'enfant
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection de l'enfant */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pour quel enfant ?
            </h2>
            <div>
              <label className="label">
                Sélectionner un enfant <span className="text-red-600">*</span>
              </label>
              <select
                name="childId"
                value={formData.childId}
                onChange={handleChange}
                className="input"
              >
                <option value="">-- Choisir un enfant --</option>
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.firstName} {child.lastName} ({child.age} ans)
                  </option>
                ))}
              </select>
              {errors.childId && (
                <p className="error-message">{errors.childId}</p>
              )}
            </div>
          </Card>

          {/* Sélection de l'émotion */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quelle émotion ? <span className="text-red-600">*</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {emotions.map((emotion) => {
                const Icon = emotion.icon;
                const isSelected = formData.emotion === emotion.value;
                
                return (
                  <button
                    key={emotion.value}
                    type="button"
                    onClick={() => handleEmotionSelect(emotion.value)}
                    className="p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2"
                    style={{
                      borderColor: isSelected ? emotion.color : '#e5e7eb',
                      background: isSelected ? emotion.bg : '#fff',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <Icon 
                      className="w-12 h-12"
                      style={{ color: emotion.color }}
                    />
                    <span className="font-medium text-gray-900">
                      {emotion.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.emotion && (
              <p className="error-message mt-2">{errors.emotion}</p>
            )}
          </Card>

          {/* Intensité */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Intensité <span className="text-red-600">*</span>
            </h2>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Faible</span>
                <span className="text-lg font-bold" style={{ color: selectedEmotion?.color }}>
                  {formData.intensity}/5
                </span>
                <span className="text-sm text-gray-600">Forte</span>
              </div>
              <input
                type="range"
                name="intensity"
                min="1"
                max="5"
                value={formData.intensity}
                onChange={handleChange}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${selectedEmotion?.color || '#0ea5e9'} 0%, ${selectedEmotion?.color || '#0ea5e9'} ${(formData.intensity / 5) * 100}%, #e5e7eb ${(formData.intensity / 5) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>😐</span>
                <span>🙂</span>
                <span>😊</span>
                <span>😃</span>
                <span>🤩</span>
              </div>
            </div>
          </Card>

          {/* Détails */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Détails
            </h2>
            
            <div className="space-y-4">
              {/* Source */}
              <div>
                <label className="label">
                  Comment l'émotion a été détectée ? <span className="text-red-600">*</span>
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="parent_observation">Observation parent</option>
                  <option value="camera_nlp">Caméra NLP</option>
                  <option value="game">Jeu éducatif</option>
                  <option value="manual">Manuel</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              {/* Contexte */}
              <div>
                <label className="label">
                  Contexte / Situation
                </label>
                <textarea
                  name="context"
                  value={formData.context}
                  onChange={handleChange}
                  rows="3"
                  className="input"
                  placeholder="Décrivez la situation (ex: En jouant avec ses jouets préférés, Après le repas...)"
                />
              </div>

              {/* Lieu */}
              <div>
                <label className="label">Lieu</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="home">Maison</option>
                  <option value="school">École</option>
                  <option value="therapy">Thérapie</option>
                  <option value="public">Lieu public</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Déclencheurs */}
              <div>
                <label className="label">
                  Déclencheurs (séparés par des virgules)
                </label>
                <input
                  type="text"
                  name="triggers"
                  value={formData.triggers}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ex: bruit fort, changement de routine, nouvelle personne"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Séparez par des virgules pour plusieurs déclencheurs
                </p>
              </div>

              {/* Durée */}
              <div>
                <label className="label">
                  Durée (en minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ex: 15"
                  min="0"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="label">
                  Notes additionnelles
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="input"
                  placeholder="Informations supplémentaires, observations particulières..."
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="loading-spinner" />
                  <span className="ml-2">Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Enregistrer l'émotion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddEmotion;