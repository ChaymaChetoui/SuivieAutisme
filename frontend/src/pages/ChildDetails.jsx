import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import childService from "../services/childService";
import Layout from "../components/dashboard/Layout";
import Loading from "../components/common/loading";
import { ArrowLeft, Edit, Calendar } from "lucide-react";
import "../styles/child-details.css";

const ChildDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChild = async () => {
      try {
        const res = await childService.getChildById(id);
        setChild(res.data);
      } catch {
        navigate("/children");
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [id, navigate]);

  if (loading) {
    return (
      <Layout>
        <Loading fullScreen text="Chargement du profil..." />
      </Layout>
    );
  }

  if (!child) return null;

  const getLevelBadge = (level) => {
    switch (level) {
      case "léger": return "badge badge-green";
      case "modéré": return "badge badge-yellow";
      case "sévère": return "badge badge-red";
      default: return "badge";
    }
  };

  return (
    <Layout>
      <div className="child-details-container">

        {/* Header */}
        <div className="details-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft /> Retour
          </button>

          <div className="avatar">
            {child.firstName.charAt(0)}
          </div>

          <h1 className="child-name">
            {child.firstName} {child.lastName}
          </h1>

          <span className={getLevelBadge(child.autismLevel)}>
            Niveau {child.autismLevel}
          </span>
        </div>

        {/* Info Card */}
        <div className="details-card">
          <div className="info-row">
            <strong>Âge :</strong>
            <span>{child.age} ans</span>
          </div>

          <div className="info-row">
            <strong>Genre :</strong>
            <span>{child.gender === "male" ? "Garçon" : "Fille"}</span>
          </div>

          {child.diagnosticDate && (
            <div className="info-row">
              <strong>Diagnostic :</strong>
              <span className="date-field">
                <Calendar /> {new Date(child.diagnosticDate).toLocaleDateString("fr-FR")}
              </span>
            </div>
          )}

          {child.medicalNotes && (
            <div className="notes-box">
              <h3>Notes médicales</h3>
              <p>{child.medicalNotes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="details-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/children/${child._id}/edit`)}
          >
            <Edit /> Modifier le profil
          </button>
        </div>

      </div>
    </Layout>
  );
};

export default ChildDetails;
