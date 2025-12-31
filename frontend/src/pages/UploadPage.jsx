import { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  Alert,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Papa from "papaparse";

const MAX_FILE_SIZE_MB = 10;
const REQUIRED_COLS = ["PRCTR","BSCHL","HKONT","WAERS","BUKRS","KTOSL","DMBTR","WRBTR"];

export default function UploadPageAdvanced({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [missingCols, setMissingCols] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // ===== Animated background =====
  const [bgOffset, setBgOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBgOffset((prev) => (prev + 1) % 360), 50);
    return () => clearInterval(id);
  }, []);

  // ===== Validation =====
  const validateFile = (file) => {
    if (!file) return "Please select a file";
    if (!file.name.toLowerCase().endsWith(".csv")) return "Only CSV files are allowed";
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024)
      return `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
    return "";
  };

  // ===== Parse CSV preview + check missing columns =====
  const generatePreview = (file) => {
    Papa.parse(file, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields;
        const missing = REQUIRED_COLS.filter((c) => !cols.includes(c));
        setMissingCols(missing);
        setFilePreview({ columns: cols, rows: results.data });
      },
      error: (err) => console.error("CSV parse error:", err),
    });
  };

  // ===== File select =====
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setError("");
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFile(null);
      setFilePreview(null);
      setMissingCols([]);
      setError(validationError);
      return;
    }
    setFile(selectedFile);
    generatePreview(selectedFile);
    e.target.value = "";
  };

  // ===== Drag & drop =====
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileChange({ target: { files: [droppedFile] } });
  };
  const handleDragOver = (e) => e.preventDefault();

  // ===== Upload =====
  const handleUpload = async () => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (missingCols.length > 0) {
      setError(`Cannot upload. Missing columns: ${missingCols.join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setUploadProgress(0);

      // Animation for progress
      const interval = setInterval(() => {
        setUploadProgress((p) => Math.min(100, p + Math.random() * 20));
      }, 200);

      await onUploaded(file);

      clearInterval(interval);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to upload and score file. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 400);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: `linear-gradient(${bgOffset}deg, #e0f7fa, #90caf9, #42a5f5, #64b5f6)`,
        backgroundSize: "600% 600%",
        animation: "gradientAnimation 15s ease infinite",
      }}
    >
      <Card
        sx={{
          width: { xs: "100%", sm: 520 },
          borderRadius: 4,
          p: 3,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
        }}
      >
        <CardContent>
          <Stack spacing={3} alignItems="center">
            <CloudUploadIcon sx={{ fontSize: 80, color: "#1976d2" }} />
            <Typography variant="h5" fontWeight={700} align="center">
              SAP Anomaly Detection
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Upload your CSV file to detect anomalies in transactions.
            </Typography>

            {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}
            {missingCols.length > 0 && (
              <Alert severity="warning" sx={{ width: "100%" }}>
                Missing required columns: {missingCols.join(", ")}
              </Alert>
            )}

            {loading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ width: "100%" }} />}

            {/* Drag & Drop Area */}
            <Tooltip title="Drag & drop CSV here or click to select file" arrow>
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                sx={{
                  border: "2px dashed #90caf9",
                  borderRadius: 2,
                  width: "100%",
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { background: "#e3f2fd" },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <>
                    <Typography variant="body1" fontWeight={500}>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Drag & drop your CSV file here, or click to select
                  </Typography>
                )}
                <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileChange} />
              </Box>
            </Tooltip>

            {/* CSV Preview */}
            {filePreview && (
              <Box sx={{ width: "100%", overflowX: "auto", mt: 2 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {REQUIRED_COLS.map((col) => (
                        <th
                          key={col}
                          style={{
                            borderBottom: "1px solid #ccc",
                            padding: 4,
                            textAlign: "left",
                            color: filePreview.columns.includes(col) ? "inherit" : "red",
                          }}
                        >
                          {col}{!filePreview.columns.includes(col) ? " *" : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filePreview.rows.map((row, idx) => (
                      <tr key={idx}>
                        {REQUIRED_COLS.map((col) => (
                          <td
                            key={col}
                            style={{
                              borderBottom: "1px solid #eee",
                              padding: 4,
                              backgroundColor: filePreview.columns.includes(col) ? "inherit" : "#ffe5e5",
                            }}
                          >
                            {row[col] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}

            {/* Upload Button */}
            <Button
              variant="contained"
              fullWidth
              disabled={!file || loading || missingCols.length > 0}
              onClick={handleUpload}
            >
              Upload & Score
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
