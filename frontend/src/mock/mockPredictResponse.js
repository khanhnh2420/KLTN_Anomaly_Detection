const mockPredictResponse = {
  status: "success",
  meta: {
    rows_total: 412345,
    features_used: 18,
    processing_time_ms: 1240,
    model: "(joblib)",
    threshold: 0.985
  },
  summary: {
    normal: 411921,
    anomaly: 424,
    anomaly_ratio: 0.00103
  },
  severity: {
    low: 271,
    medium: 118,
    high: 35
  },
  top_anomalies: [
    { row_id: 18321, score: 0.997, severity: "high" },
    { row_id: 92117, score: 0.993, severity: "high" },
    { row_id: 55678, score: 0.989, severity: "medium" },
    { row_id: 102334, score: 0.975, severity: "medium" },
    { row_id: 209991, score: 0.962, severity: "low" }
  ]
};

export default mockPredictResponse;
