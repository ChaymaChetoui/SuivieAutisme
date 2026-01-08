import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import childService from '../services/childService';
import Layout from '../components/dashboard/Layout';
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
  AlertCircle,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

import '../styles/children-list.css';

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
      toast.error('Erreur lors du chargement des enfants');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (childId, childName) => {
    if (!window.confirm(`Supprimer ${childName} ? Cette action est irréversible.`)) return;

    try {
      await childService.deleteChild(childId);
      toast.success('Enfant supprimé');
      fetchChildren();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredChildren = children.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelBadge = (level) => {
    switch (level) {
      case 'léger': return 'level-badge level-green';
      case 'modéré': return 'level-badge level-yellow';
      case 'sévère': return 'level-badge level-red';
      default: return 'level-badge';
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
      <div className="children-container">

        {/* Header */}
        <div className="children-header">
          <div>
            <h1 className="page-title">Mes enfants</h1>
            <p className="page-subtitle">Gérez les profils et le suivi émotionnel</p>
          </div>

          <Link to="/children/new">
            <button className="btn btn-primary btn-with-icon">
              <Plus className="icon" />
              Ajouter un enfant
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="children-search-card">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un enfant..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="children-search-input"
          />
        </div>

        {/* Empty State */}
        {filteredChildren.length === 0 ? (
          <div className="empty-state">
            <AlertCircle className="empty-icon" />
            <h3 className="empty-title">
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun enfant enregistré'}
            </h3>
            <p className="empty-text">
              {searchTerm
                ? 'Essayez avec un autre mot clé'
                : 'Ajoutez votre premier enfant pour commencer le suivi'}
            </p>

            {!searchTerm && (
              <Link to="/children/new">
                <button className="btn btn-primary btn-with-icon">
                  <Plus className="icon" /> Ajouter un enfant
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="children-grid">
            {filteredChildren.map((child, i) => (
              <div
                key={child._id}
                className="child-card"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Actions */}
                <div className="card-actions">
                  <button
                    onClick={() =>
                      setShowActions(showActions === child._id ? null : child._id)
                    }
                    className="action-btn"
                  >
                    <MoreVertical />
                  </button>

                  {showActions === child._id && (
                    <div className="actions-menu">
                      <button onClick={() => navigate(`/children/${child._id}`)}>
                        <Eye /> Voir le profil
                      </button>
                      <button onClick={() => navigate(`/children/${child._id}/edit`)}>
                        <Edit /> Modifier
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(child._id, child.firstName)}
                      >
                        <Trash2 /> Supprimer
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <Link to={`/children/${child._id}`} className="child-content">
                  <div className="child-avatar">
                    {child.firstName.charAt(0)}
                  </div>

                  <h3 className="child-name">
                    {child.firstName} {child.lastName}
                  </h3>

                  <p className="child-details">
                    {child.age} ans • {child.gender === 'male' ? 'Garçon' : 'Fille'}
                  </p>

                  <span className={getLevelBadge(child.autismLevel)}>
                    Niveau {child.autismLevel}
                  </span>

                  {child.diagnosticDate && (
                    <div className="child-date">
                      <Calendar /> Diagnostic : {new Date(child.diagnosticDate).toLocaleDateString('fr-FR')}
                    </div>
                  )}

                  {child.medicalNotes && (
                    <p className="child-notes">
                      {child.medicalNotes}
                    </p>
                  )}
                </Link>

                {/* Footer Buttons */}
                <div className="child-footer">
                  <button
                    className="btn btn-outline btn-small"
                    onClick={() => navigate(`/children/${child._id}`)}
                  >
                    <Eye /> Profil
                  </button>

                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => navigate(`/emotions/new?childId=${child._id}`)}
                  >
                    <Plus /> Ajouter émotion
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChildrenList;
