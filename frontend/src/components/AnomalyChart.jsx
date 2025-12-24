import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";


ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);


export default function AnomalyChart({ rows }) {
  return (
    <Bar
      data={{
        labels: rows.map((r) => r.BELNR),
        datasets: [{ label: "Anomaly Score", data: rows.map((r) => r.anomaly_scored) }],
      }}
    />
  );
}