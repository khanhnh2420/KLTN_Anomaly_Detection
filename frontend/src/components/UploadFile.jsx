import React from "react";
import { Button } from "@mui/material";

const UploadFile = ({ setRawResults }) => {

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let results = [];

        if (file.name.endsWith(".json")) {
          results = JSON.parse(text);
        } else if (file.name.endsWith(".csv")) {
          const lines = text.split("\n").filter(l => l.trim() !== "");
          const header = lines[0].split(",");
          const scoreIdx = header.indexOf("score");
          const anomalyIdx = header.indexOf("is_anomaly");

          results = lines.slice(1).map(line => {
            const cols = line.split(",");
            return {
              score: parseFloat(cols[scoreIdx]),
              is_anomaly: cols[anomalyIdx].trim().toLowerCase() === "true"
            };
          });
        } else {
          alert("Chỉ hỗ trợ CSV hoặc JSON");
          return;
        }

        results = results.map((r, idx) => ({ id: idx + 1, ...r }));
        setRawResults(results);

      } catch (err) {
        alert("File không hợp lệ");
        console.error(err);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <input
        type="file"
        accept=".json,.csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button variant="contained" component="span" color="primary">
          Upload CSV/JSON
        </Button>
      </label>
    </div>
  );
};

export default UploadFile;
