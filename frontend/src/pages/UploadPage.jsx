import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!file) return alert("Select CSV file");
    navigate("/result", { state: { file } });
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Upload SAP CSV</h2>

      <input
        type="file"
        accept=".csv"
        onChange={e => setFile(e.target.files[0])}
      />

      <br /><br />
      <button onClick={handleSubmit}>Detect Anomalies</button>
    </div>
  );
}
