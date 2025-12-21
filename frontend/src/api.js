export const detectAnomalies = async (file) => {
  await new Promise((res) => setTimeout(res, 1000));

  return {
    total_samples: 100,
    anomalies: 12,
    anomaly_rate: 0.12,
    results: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      score: Math.random(),
      is_anomaly: Math.random() < 0.12,
    })),
  };
};
