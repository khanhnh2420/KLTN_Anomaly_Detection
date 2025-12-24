import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { scoreCsv } from "../services/api";

export default function ResultPage() {
  const { state } = useLocation();
  const file = state?.file;

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!file) return;

    scoreCsv(file, page, PAGE_SIZE).then(res => {
      setRows(res.data);
      setMeta(res.meta);
    });
  }, [file, page]);

  if (!file) return <p>No file uploaded</p>;

  return (
    <div style={{ padding: 30 }}>
      <h2>Detection Result</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>BELNR</th>
            <th>Anomaly Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.BELNR}</td>
              <td>{r.anomaly_scored.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
        Prev
      </button>

      <span style={{ margin: "0 10px" }}>
        Page {meta.page} / {meta.total_pages}
      </span>

      <button
        disabled={page === meta.total_pages}
        onClick={() => setPage(p => p + 1)}
      >
        Next
      </button>
    </div>
  );
}
