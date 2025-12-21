import React, { useState, useMemo } from "react";
import UploadFile from "./UploadFile";
import FilterPanel from "./FilterPanel";
import ResultsTable from "./ResultsTable";
import ChartsPanel from "./ChartsPanel";

const sampleData = [
  { id: 1, score: 0.95, is_anomaly: true },
  { id: 2, score: 0.12, is_anomaly: false },
  { id: 3, score: 0.67, is_anomaly: false },
  { id: 4, score: 0.89, is_anomaly: true },
  { id: 5, score: 0.45, is_anomaly: false },
  { id: 6, score: 0.33, is_anomaly: false },
  { id: 7, score: 0.77, is_anomaly: true },
  { id: 8, score: 0.22, is_anomaly: false },
  { id: 9, score: 0.66, is_anomaly: false },
  { id: 10, score: 0.99, is_anomaly: true },
];


const Dashboard = () => {
  const [rawResults, setRawResults] = useState(sampleData); // <- gán data mẫu
  const [scoreRange, setScoreRange] = useState([0, 1]);
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [highlightedRow, setHighlightedRow] = useState(null);

  const results = useMemo(() =>
    rawResults
      .filter(r => 
        r.id.toString().includes(searchId) &&
        r.score >= scoreRange[0] &&
        r.score <= scoreRange[1] &&
        (!showAnomaliesOnly || r.is_anomaly)
      ),
    [rawResults, searchId, scoreRange, showAnomaliesOnly]
  );

  return (
    <div style={{ padding: 20 }}>
      <UploadFile setRawResults={setRawResults} />
      <FilterPanel
        scoreRange={scoreRange}
        setScoreRange={setScoreRange}
        showAnomaliesOnly={showAnomaliesOnly}
        setShowAnomaliesOnly={setShowAnomaliesOnly}
        searchId={searchId}
        setSearchId={setSearchId}
      />
      <ChartsPanel results={results} highlightedRow={highlightedRow} />
      <ResultsTable results={results} onRowHover={setHighlightedRow} />
    </div>
  );
};

export default Dashboard;
