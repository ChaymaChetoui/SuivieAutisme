import { useEffect, useState } from "react";
import emotionService from "../services/emotionService";
import Layout from "../components/dashboard/Layout";
import Loading from "../components/common/loading";
import EmotionStats from "../components/emotions/EmotionStats";

const StatisticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await emotionService.getEmotionStats(/* ici l'id de l'enfant ou global */);
        setStats(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Layout><Loading fullScreen text="Chargement..." /></Layout>;

  return (
    <Layout>
      {stats ? <EmotionStats stats={stats} /> : <p>Aucune statistique disponible</p>}
    </Layout>
  );
};

export default StatisticsPage;
