import { useState } from "react";
import { predictAnomaly } from "../services/api";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from "recharts";

const COLORS = ["#22c55e", "#ef4444"];

export default function AnomalyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setLoading(true);
    const res = await predictAnomaly(file);
    setData(res);
    setLoading(false);
  };

  if (!data)
    return <input type="file" onChange={handleUpload} />;

  const pieData = [
    { name: "Normal", value: data.summary.normal },
    { name: "Anomaly", value: data.summary.anomaly }
  ];

  const barData = Object.entries(data.severity).map(([k, v]) => ({
    severity: k,
    count: v
  }));

  return (
    <div style={{ padding: 20 }}>
      <h2>Anomaly Detection Dashboard</h2>

      {loading && <p>Processing...</p>}

      <h3>KPI</h3>
      <p>Total Rows: {data.meta.rows_total}</p>
      <p>Anomaly Ratio: {(data.summary.anomaly_ratio * 100).toFixed(2)}%</p>

      <PieChart width={300} height={300}>
        <Pie data={pieData} dataKey="value">
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Pie>
      </PieChart>

      <BarChart width={400} height={250} data={barData}>
        <XAxis dataKey="severity" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" />
      </BarChart>

      <h3>Top Anomalies</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Row ID</th>
            <th>Score</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          {data.top_anomalies.map((a, i) => (
            <tr key={i}>
              <td>{a.row_id}</td>
              <td>{a.score}</td>
              <td>{a.severity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
