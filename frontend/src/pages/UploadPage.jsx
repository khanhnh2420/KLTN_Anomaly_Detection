import { useState } from "react";


export default function UploadPage({ onUploaded }) {
  const [file, setFile] = useState(null);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a CSV file");
    onUploaded(file);
  };


  return (
    <div style={{ padding: 40 }}>
      <h2>Upload SAP CSV</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />
        <button type="submit">Upload & Score</button>
      </form>
    </div>
  );
}