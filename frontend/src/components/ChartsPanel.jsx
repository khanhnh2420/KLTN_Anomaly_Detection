import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ChartsPanel = ({ results, highlightedRow }) => {
  const bins = Array.from({ length: 10 }, (_, i) => ({ range: `${i/10}-${(i+1)/10}`, count: 0 }));
  results.forEach(r => {
    const idx = Math.min(Math.floor(r.score * 10), 9);
    bins[idx].count += 1;
  });
  const highlightedBin = highlightedRow ? Math.min(Math.floor(highlightedRow.score * 10), 9) : null;

  const barData = {
    labels: bins.map(b => b.range),
    datasets: [
      {
        label: "Count",
        data: bins.map((b, idx) => b.count),
        backgroundColor: bins.map((b, idx) => (highlightedBin === idx ? "#ff9900" : "#8884d8")),
      },
    ],
  };

  const pieData = {
    labels: ["Normal", "Anomaly"],
    datasets: [
      {
        data: [results.filter(r => !r.is_anomaly).length, results.filter(r => r.is_anomaly).length],
        backgroundColor: ["#82ca9d", "#d32f2f"],
      },
    ],
  };

  return (
    <div style={{ display: "flex", gap: 50, marginTop: 20, flexWrap: "wrap" }}>
      <div style={{ width: 400, height: 300 }}>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
      </div>
      <div style={{ width: 300, height: 300 }}>
        <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
      </div>
    </div>
  );
};

export default ChartsPanel;
