import { useState } from "react";
import { Box } from "@mui/material";
import UploadPage from "./pages/UploadPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  const [file, setFile] = useState(null);

  return (
    <Box sx={{ minHeight: "100vh" }}>
      {!file ? (
        <UploadPage onUploaded={setFile} />
      ) : (
        <ResultPage file={file} onBack={() => setFile(null)} />
      )}
    </Box>
  );
}
