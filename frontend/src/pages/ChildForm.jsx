// src/pages/ChildForm.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import childService from '../services/childService';
import therapistService from '../services/therapistService';
import Layout from '../components/dashboard/Layout';
import Card from '../components/common/card';
import Input from '../components/common/input';
import Button from '../components/common/button';
import Loading from '../components/common/loading';
import { ArrowLeft, Save, Plus, X, Search, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ChildForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = !!id;
  const isTherapist = user?.role === 'therapist';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [searchingParent, setSearchingParent] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
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
    specialNeeds: [],
    parentId: '',
    loginCode: ''
  });
  
  const [errors, setErrors] = useState({});
  const [parentSearch, setParentSearch] = useState('');
  const [parentResults, setParentResults] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);

  const [newAllergy, setNewAllergy] = useState({ name: '', severity: 'mild', notes: '' });
  const [newMedication, setNewMedication] = useState({ 
    name: '', 
    dosage: '', 
    frequency: '', 
    prescribedBy: '', 
    startDate: '' 
  });
  const [newNeed, setNewNeed] = useState({ 
    type: 'communication', 
    description: '',
    accommodations: []
  });

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  useEffect(() => {
    if (isEdit) {
      fetchChild();
    }
  }, [id]);

  const fetchChild = async () => {
  try {
    const response = await childService.getChildById(id);
    const child = response.data;
    
    // Formater les dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return dateString.split('T')[0];
    };
    
    // Transformer les allergies et specialNeeds du modèle (strings) en objets pour le frontend
    const transformAllergies = (allergies) => {
      if (!allergies || !Array.isArray(allergies)) return [];
      return allergies.map(item => {
        if (typeof item === 'object' && item.name) {
          return item; // Déjà un objet
        }
        return { name: String(item), severity: 'mild', notes: '' };
      });
    };
    
    const transformSpecialNeeds = (needs) => {
      if (!needs || !Array.isArray(needs)) return [];
      return needs.map(item => {
        if (typeof item === 'object' && item.type) {
          return item; // Déjà un objet
        }
        return { type: String(item), description: '', accommodations: [] };
      });
    };
    
    setFormData({
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      dateOfBirth: formatDate(child.dateOfBirth) || '',
      gender: child.gender || 'male',
      autismLevel: child.autismLevel || 'modéré',
      diagnosticDate: formatDate(child.diagnosticDate) || '',
      medicalNotes: child.medicalNotes || '',
      allergies: transformAllergies(child.allergies),
      medications: child.medications || [],
      specialNeeds: transformSpecialNeeds(child.specialNeeds),
      parentId: child.parentId || '',
      loginCode: child.loginCode || ''
    });

    // Si edit et enfant a un parent, charger les infos du parent
    if (child.parentId) {
      try {
        const parentResponse = await therapistService.searchParents('');
        const parent = parentResponse.data?.find(p => p._id === child.parentId);
        if (parent) {
          setSelectedParent(parent);
        }
      } catch (error) {
        console.error('Error loading parent info:', error);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    toast.error('Erreur lors du chargement');
    navigate('/children');
  } finally {
    setLoading(false);
  }
};
  const searchParents = async (query) => {
    if (!query || query.length < 2) {
      setParentResults([]);
      return;
    }

    try {
      setSearchingParent(true);
      const response = await therapistService.searchParents(query);
      setParentResults(response.data || []);
    } catch (error) {
      console.error('Error searching parents:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setSearchingParent(false);
    }
  };

  const selectParent = (parent) => {
    setSelectedParent(parent);
    setFormData(prev => ({ ...prev, parentId: parent._id }));
    setParentSearch('');
    setParentResults([]);
    setErrors(prev => ({ ...prev, parentId: '' }));
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
    
    // Validations de base
    if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date de naissance requise';
    if (!formData.gender) newErrors.gender = 'Genre requis';
    if (!formData.autismLevel) newErrors.autismLevel = 'Niveau d\'autisme requis';
    
    // Validation du code de connexion
    if (!formData.loginCode) {
      newErrors.loginCode = 'Code de connexion requis';
    } else if (!/^\d{6}$/.test(formData.loginCode)) {
      newErrors.loginCode = 'Le code doit contenir exactement 6 chiffres';
    }
    
    // Validation de la date de naissance (pas dans le futur)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = 'La date de naissance ne peut pas être dans le futur';
      }
    }
    
    // Si thérapeute et création, vérifier le parent
    if (isTherapist && !isEdit && !formData.parentId) {
      newErrors.parentId = 'Vous devez sélectionner un parent';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  const newErrors = validate();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    toast.error('Veuillez corriger les erreurs');
    return;
  }

  setSaving(true);
  try {
    // Transformer les données
    const submitData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      autismLevel: formData.autismLevel,
      diagnosticDate: formData.diagnosticDate || null,
      medicalNotes: formData.medicalNotes.trim() || null,
      allergies: formData.allergies.map(allergy => 
        typeof allergy === 'object' ? allergy.name : allergy
      ).filter(name => name && name.trim()),
      medications: formData.medications.filter(med => med.name.trim()),
      specialNeeds: formData.specialNeeds.map(need => 
        typeof need === 'object' ? need.type : need
      ).filter(type => type && type.trim()),
      loginCode: formData.loginCode.trim(),
      ...(isTherapist && !isEdit && { parentId: formData.parentId })
    };

    console.log('Sending data to server:', submitData);

    if (isEdit) {
      await childService.updateChild(id, submitData);
      toast.success('Enfant modifié avec succès');
      navigate('/children');
    } else {
      if (isTherapist) {
        // Essayer de créer avec le thérapeute
        try {
          const response = await therapistService.createChildWithParent(submitData);
          
          // Vérifier si le backend a créé un profil thérapeute automatiquement
          if (response.data.warning) {
            toast.success('Enfant créé avec succès! ' + response.data.warning);
          } else {
            toast.success('Patient ajouté avec succès');
          }
          
          navigate('/therapist/patients');
          
        } catch (error) {
          // Si erreur liée au profil thérapeute, proposer de l'initialiser
          if (error.response?.data?.message?.includes('profil thérapeute')) {
            const shouldInit = window.confirm(
              'Votre profil thérapeute n\'est pas complet. Voulez-vous l\'initialiser maintenant ?'
            );
            
            if (shouldInit) {
              // Initialiser le profil
              await therapistService.initTherapistProfile();
              toast.success('Profil thérapeute initialisé. Veuillez réessayer.');
            } else {
              toast.error('Impossible de créer l\'enfant sans profil thérapeute complet.');
            }
          } else {
            throw error;
          }
        }
      } else {
        await childService.createChild(submitData);
        toast.success('Enfant ajouté avec succès');
        navigate('/children');
      }
    }
    
  } catch (error) {
    console.error('Error saving child:', error);
    
    let message = 'Erreur lors de l\'enregistrement';
    let fieldError = null;
    
    if (error.response?.data) {
      message = error.response.data.message || message;
      fieldError = error.response.data.field;
      
      if (fieldError) {
        setErrors(prev => ({ ...prev, [fieldError]: message }));
      } else if (error.response.data.errors) {
        const newErrors = {};
        error.response.data.errors.forEach(err => {
          const field = err.path || err.field;
          if (field) {
            newErrors[field] = err.msg || err.message;
          }
        });
        setErrors(newErrors);
      }
    }
    
    toast.error(message);
  } finally {
    setSaving(false);
  }
};

  // Gestion des allergies
  const addAllergy = () => {
    if (newAllergy.name.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, { ...newAllergy }]
      }));
      setNewAllergy({ name: '', severity: 'mild', notes: '' });
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  // Gestion des médicaments
  const addMedication = () => {
    if (newMedication.name.trim()) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { 
          ...newMedication,
          startDate: newMedication.startDate || undefined
        }]
      }));
      setNewMedication({ name: '', dosage: '', frequency: '', prescribedBy: '', startDate: '' });
    }
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  // Gestion des besoins spéciaux
  const addNeed = () => {
    if (newNeed.type.trim()) {
      setFormData(prev => ({
        ...prev,
        specialNeeds: [...prev.specialNeeds, { 
          ...newNeed,
          accommodations: newNeed.accommodations || []
        }]
      }));
      setNewNeed({ type: 'communication', description: '', accommodations: [] });
    }
  };

  const removeNeed = (index) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((_, i) => i !== index)
    }));
  };

  // Types de besoins spéciaux
  const needTypes = [
    { value: 'communication', label: 'Communication' },
    { value: 'social', label: 'Social' },
    { value: 'behavioral', label: 'Comportemental' },
    { value: 'sensory', label: 'Sensoriel' },
    { value: 'learning', label: 'Apprentissage' },
    { value: 'physical', label: 'Physique' },
    { value: 'medical', label: 'Médical' }
  ];

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
            className="btn btn-ghost p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Modifier' : 'Ajouter un'} {isTherapist ? 'patient' : 'enfant'}
            </h1>
            <p className="mt-1 text-gray-600">
              {isEdit ? 'Mettez à jour les informations' : 'Remplissez les informations de base'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du parent (uniquement pour thérapeute en création) */}
          {isTherapist && !isEdit && (
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Parent du patient
              </h2>
              
              {selectedParent ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedParent.firstName} {selectedParent.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{selectedParent.email}</p>
                        {selectedParent.phone && (
                          <p className="text-sm text-gray-600">{selectedParent.phone}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParent(null);
                        setFormData(prev => ({ ...prev, parentId: '' }));
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      Changer
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher un parent par email..."
                      value={parentSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setParentSearch(value);
                        
                        // Debounce la recherche
                        if (searchTimeout) clearTimeout(searchTimeout);
                        
                        const timeout = setTimeout(() => {
                          searchParents(value);
                        }, 300);
                        
                        setSearchTimeout(timeout);
                      }}
                      className="input pl-10"
                    />
                  </div>
                  
                  {errors.parentId && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{errors.parentId}</p>
                    </div>
                  )}

                  {/* Résultats de recherche */}
                  {searchingParent && (
                    <div className="mt-2 text-center py-4">
                      <Loading text="Recherche..." />
                    </div>
                  )}

                  {!searchingParent && parentResults.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                      {parentResults.map((parent) => (
                        <button
                          key={parent._id}
                          type="button"
                          onClick={() => selectParent(parent)}
                          className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0 transition"
                        >
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">
                              {parent.firstName} {parent.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{parent.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchingParent && parentSearch && parentResults.length === 0 && (
                    <div className="mt-2 text-center py-4 text-gray-600">
                      Aucun parent trouvé. Vérifiez l'email.
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

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
                placeholder="Ex: Jean"
              />
              <Input
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
                placeholder="Ex: Dupont"
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
                  Genre <span className="text-red-600">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`input ${errors.gender ? 'border-red-500' : ''}`}
                >
                  <option value="male">Garçon</option>
                  <option value="female">Fille</option>
                  <option value="other">Autre</option>
                </select>
                {errors.gender && (
                  <p className="error-message">{errors.gender}</p>
                )}
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
                    Niveau d'autisme <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="autismLevel"
                    value={formData.autismLevel}
                    onChange={handleChange}
                    className={`input ${errors.autismLevel ? 'border-red-500' : ''}`}
                  >
                    <option value="léger">Léger</option>
                    <option value="modéré">Modéré</option>
                    <option value="sévère">Sévère</option>
                  </select>
                  {errors.autismLevel && (
                    <p className="error-message">{errors.autismLevel}</p>
                  )}
                </div>
                <Input
                  label="Date du diagnostic"
                  type="date"
                  name="diagnosticDate"
                  value={formData.diagnosticDate}
                  onChange={handleChange}
                  placeholder="Optionnel"
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
                  placeholder="Informations importantes concernant la santé, traitements en cours, recommandations médicales..."
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="label">Allergies</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Nom de l'allergie"
                    value={newAllergy.name}
                    onChange={(e) => setNewAllergy({...newAllergy, name: e.target.value})}
                    className="input"
                  />
                  <select
                    value={newAllergy.severity}
                    onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value})}
                    className="input"
                  >
                    <option value="mild">Légère</option>
                    <option value="moderate">Modérée</option>
                    <option value="severe">Sévère</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Notes (optionnel)"
                    value={newAllergy.notes}
                    onChange={(e) => setNewAllergy({...newAllergy, notes: e.target.value})}
                    className="input"
                  />
                  <button 
                    type="button" 
                    onClick={addAllergy}
                    className="btn btn-primary"
                    disabled={!newAllergy.name.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.allergies.map((allergy, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">{allergy.name}</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          allergy.severity === 'severe' ? 'bg-red-100 text-red-800' :
                          allergy.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {allergy.severity === 'severe' ? 'Sévère' :
                           allergy.severity === 'moderate' ? 'Modérée' : 'Légère'}
                        </span>
                        {allergy.notes && (
                          <p className="text-sm text-gray-600 mt-1">{allergy.notes}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAllergy(index)}
                        className="text-red-600 hover:text-red-800 transition"
                        aria-label="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Médicaments */}
              <div>
                <label className="label">Médicaments</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Nom du médicament"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Fréquence"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Prescrit par"
                    value={newMedication.prescribedBy}
                    onChange={(e) => setNewMedication({...newMedication, prescribedBy: e.target.value})}
                    className="input"
                  />
                  <input
                    type="date"
                    placeholder="Date de début"
                    value={newMedication.startDate}
                    onChange={(e) => setNewMedication({...newMedication, startDate: e.target.value})}
                    className="input"
                  />
                  <button 
                    type="button" 
                    onClick={addMedication}
                    className="btn btn-primary"
                    disabled={!newMedication.name.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.medications.map((medication, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">{medication.name}</span>
                        {medication.dosage && (
                          <span className="ml-2 text-sm text-gray-600">Dosage: {medication.dosage}</span>
                        )}
                        {medication.frequency && (
                          <span className="ml-2 text-sm text-gray-600">Fréquence: {medication.frequency}</span>
                        )}
                        {medication.prescribedBy && (
                          <p className="text-sm text-gray-600 mt-1">Prescrit par: {medication.prescribedBy}</p>
                        )}
                        {medication.startDate && (
                          <p className="text-sm text-gray-600">Début: {new Date(medication.startDate).toLocaleDateString()}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-800 transition"
                        aria-label="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Besoins spéciaux */}
              <div>
                <label className="label">Besoins spéciaux</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <select
                    value={newNeed.type}
                    onChange={(e) => setNewNeed({...newNeed, type: e.target.value})}
                    className="input"
                  >
                    {needTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Description"
                    value={newNeed.description}
                    onChange={(e) => setNewNeed({...newNeed, description: e.target.value})}
                    className="input"
                  />
                  <button 
                    type="button" 
                    onClick={addNeed}
                    className="btn btn-primary"
                    disabled={!newNeed.type.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.specialNeeds.map((need, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {needTypes.find(t => t.value === need.type)?.label || need.type}
                        </span>
                        {need.description && (
                          <p className="text-sm text-gray-600 mt-1">{need.description}</p>
                        )}
                        {need.accommodations && need.accommodations.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Aménagements: {need.accommodations.join(', ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNeed(index)}
                        className="text-red-600 hover:text-red-800 transition"
                        aria-label="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code de connexion */}
              <div>
                <label className="label">
                  Code de connexion enfant <span className="text-red-600">*</span>
                </label>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      name="loginCode"
                      value={formData.loginCode}
                      onChange={handleChange}
                      placeholder="Ex: 123456"
                      maxLength="6"
                      className={`input ${errors.loginCode ? 'border-red-500' : ''}`}
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Code à 6 chiffres que le parent saisira dans l'application mobile enfant
                    </p>
                    {errors.loginCode && (
                      <p className="error-message">{errors.loginCode}</p>
                    )}
                  </div>
                  <div className="md:w-48">
                    <button
                      type="button"
                      onClick={() => {
                        // Générer un code aléatoire
                        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
                        setFormData(prev => ({ ...prev, loginCode: randomCode }));
                        if (errors.loginCode) {
                          setErrors(prev => ({ ...prev, loginCode: '' }));
                        }
                      }}
                      className="btn btn-secondary w-full"
                    >
                      Générer un code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/children')}
              className="btn btn-secondary"
              disabled={saving}
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
                  {isEdit ? 'Mettre à jour' : 'Enregistrer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ChildForm;