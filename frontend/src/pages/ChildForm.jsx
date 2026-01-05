// src/pages/ChildForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import childService from '../services/childService';
import Layout from '../components/dashboard/Layout';
import Card from '../components/common/card';
import Input from '../components/common/input';
import Button from '../components/common/button';
import Loading from '../components/common/loading';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ChildForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    autismLevel: 'modéré',
    diagnosticDate: '',
    medicalNotes: '',
    allergies: [],
    medications: [],
    specialNeeds: []
  });
  const [errors, setErrors] = useState({});
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '' });
  const [newNeed, setNewNeed] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchChild();
    }
  }, [id]);

  const fetchChild = async () => {
    try {
      const response = await childService.getChildById(id);
      const child = response.data;
      setFormData({
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth?.split('T')[0],
        gender: child.gender,
        autismLevel: child.autismLevel,
        diagnosticDate: child.diagnosticDate?.split('T')[0] || '',
        medicalNotes: child.medicalNotes || '',
        allergies: child.allergies || [],
        medications: child.medications || [],
        specialNeeds: child.specialNeeds || []
      });
    } catch (error) {
      console.error('Error fetching child:', error);
      toast.error('Erreur lors du chargement');
      navigate('/children');
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

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName) newErrors.lastName = 'Nom requis';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date de naissance requise';
    if (!formData.gender) newErrors.gender = 'Genre requis';
    if (!formData.autismLevel) newErrors.autismLevel = 'Niveau d\'autisme requis';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await childService.updateChild(id, formData);
        toast.success('Enfant modifié avec succès');
      } else {
        await childService.createChild(formData);
        toast.success('Enfant ajouté avec succès');
      }
      navigate('/children');
    } catch (error) {
      console.error('Error saving child:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMedication.name.trim()) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...newMedication }]
      }));
      setNewMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const addNeed = () => {
    if (newNeed.trim()) {
      setFormData(prev => ({
        ...prev,
        specialNeeds: [...prev.specialNeeds, newNeed.trim()]
      }));
      setNewNeed('');
    }
  };

  const removeNeed = (index) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/children')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Modifier l\'enfant' : 'Ajouter un enfant'}
            </h1>
            <p className="mt-1 text-gray-600">
              {isEdit ? 'Mettez à jour les informations' : 'Remplissez les informations de base'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Informations de base
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
              />
              <Input
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
              />
              <Input
                label="Date de naissance"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                error={errors.dateOfBirth}
                required
              />
              <div>
                <label className="label">
                  Genre <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="male">Garçon</option>
                  <option value="female">Fille</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Informations médicales */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Informations médicales
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    Niveau d'autisme <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="autismLevel"
                    value={formData.autismLevel}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="léger">Léger</option>
                    <option value="modéré">Modéré</option>
                    <option value="sévère">Sévère</option>
                  </select>
                </div>
                <Input
                  label="Date du diagnostic"
                  type="date"
                  name="diagnosticDate"
                  value={formData.diagnosticDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Notes médicales</label>
                <textarea
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleChange}
                  rows="4"
                  className="input"
                  placeholder="Informations importantes concernant la santé de l'enfant..."
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="label">Allergies</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                    placeholder="Ajouter une allergie"
                    className="input"
                  />
                  <Button type="button" onClick={addAllergy} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="ml-2 hover:text-red-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Besoins spéciaux */}
              <div>
                <label className="label">Besoins spéciaux</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newNeed}
                    onChange={(e) => setNewNeed(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNeed())}
                    placeholder="Ajouter un besoin"
                    className="input"
                  />
                  <Button type="button" onClick={addNeed} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialNeeds.map((need, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {need}
                      <button
                        type="button"
                        onClick={() => removeNeed(index)}
                        className="ml-2 hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/children')}
            >
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              <Save className="w-5 h-5 mr-2" />
              {isEdit ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ChildForm;