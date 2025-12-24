import { useEffect, useState } from "react";
import { scoreCSV } from "../services/api";


export default function ResultPage({ file, onBack }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);


  useEffect(() => {
    load();
  }, [page]);


  const load = async () => {
    const res = await scoreCSV(file, page, 20);
    setData(res.data);
    setMeta(res.meta);
  };


  return (
    <div style={{ padding: 40 }}>
      <h2>Anomaly Results</h2>


      <button onClick={onBack}>⬅ Back</button>


      <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>BELNR</th>
            <th>Anomaly Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.BELNR}</td>
              <td>{row.anomaly_scored.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>


      {meta && (
        <div style={{ marginTop: 20 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {meta.page} / {meta.total_pages}
          </span>
          <button
            disabled={page === meta.total_pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}