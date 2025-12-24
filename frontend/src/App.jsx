import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import ResultPage from "./pages/ResultPage";


export default function App() {
  const [file, setFile] = useState(null);


  return (
    <>
      {!file ? (
        <UploadPage onUploaded={setFile} />
      ) : (
        <ResultPage file={file} onBack={() => setFile(null)} />
      )}
    </>
  );
}