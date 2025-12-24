import { useState } from "react";
import { Box } from "@mui/material";
import UploadPage from "./pages/UploadPage";
import ResultPage from "./pages/ResultPage";
import LoadingScreen from "./components/LoadingScreen";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (f) => {
    setFile(f);
    setLoading(true); // Bật loading và giữ đó cho đến khi ResultPage báo xong
  };

  const handleDone = () => {
    setFile(null);
    setLoading(false);
  };

  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
      {loading && <LoadingScreen text="Scoring anomalies..." />}

      {!file ? (
        <UploadPage onUploaded={handleUpload} />
      ) : (
        <ResultPage
          file={file}
          onBack={handleDone}
          onDataReady={() => setLoading(false)}
        />
      )}
    </Box>
  );
}