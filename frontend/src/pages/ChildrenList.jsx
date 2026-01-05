// src/pages/ChildrenList.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import childService from '../services/childService';
import Layout from '../components/dashboard/Layout';
import Card from '../components/common/card';
import Loading from '../components/common/loading';
import Button from '../components/common/button';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ChildrenList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActions, setShowActions] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childService.getAllChildren();
      setChildren(response.data);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Erreur lors du chargement des enfants');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (childId, childName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${childName} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await childService.deleteChild(childId);
      toast.success('Enfant supprimé avec succès');
      fetchChildren();
    } catch (error) {
      console.error('Error deleting child:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredChildren = children.filter(child =>
    `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAutismLevelColor = (level) => {
    switch (level) {
      case 'léger':
        return 'bg-green-100 text-green-800';
      case 'modéré':
        return 'bg-yellow-100 text-yellow-800';
      case 'sévère':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement des enfants..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes enfants</h1>
            <p className="mt-1 text-gray-600">
              Gérez les profils de vos enfants
            </p>
          </div>
          <Link to="/children/new">
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un enfant
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un enfant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </Card>

        {/* Children Grid */}
        {filteredChildren.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Aucun résultat' : 'Aucun enfant enregistré'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Essayez avec un autre terme de recherche'
                  : 'Commencez par ajouter votre premier enfant'
                }
              </p>
              {!searchTerm && (
                <Link to="/children/new">
                  <Button>
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter un enfant
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChildren.map((child) => (
              <Card key={child._id} hover className="relative">
                {/* Actions Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowActions(showActions === child._id ? null : child._id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  {showActions === child._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => navigate(`/children/${child._id}`)}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4 mr-3" />
                        Voir le profil
                      </button>
                      <button
                        onClick={() => navigate(`/children/${child._id}/edit`)}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 mr-3" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(child._id, child.firstName)}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {/* Child Info */}
                <Link to={`/children/${child._id}`}>
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4">
                      {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {child.firstName} {child.lastName}
                    </h3>

                    {/* Age */}
                    <p className="text-sm text-gray-600 mb-3">
                      {child.age} ans • {child.gender === 'male' ? 'Garçon' : 'Fille'}
                    </p>

                    {/* Autism Level */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAutismLevelColor(child.autismLevel)}`}>
                      Autisme {child.autismLevel}
                    </span>

                    {/* Diagnostic Date */}
                    {child.diagnosticDate && (
                      <div className="mt-4 flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Diagnostic: {new Date(child.diagnosticDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}

                    {/* Medical Notes Preview */}
                    {child.medicalNotes && (
                      <p className="mt-3 text-xs text-gray-600 line-clamp-2">
                        {child.medicalNotes}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/children/${child._id}`)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Profil
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/emotions/new?childId=${child._id}`)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Émotion
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChildrenList;