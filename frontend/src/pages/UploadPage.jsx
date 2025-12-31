import { useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  Alert,
  LinearProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const MAX_FILE_SIZE_MB = 10;

export default function UploadPage({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return "Please select a file";

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return "Only CSV files are allowed";
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
    }

    return "";
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setError("");

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);

    // Cho phép chọn lại cùng 1 file
    e.target.value = "";
  };

  const handleUpload = async () => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onUploaded(file);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err?.message ||
          "Failed to upload and score file. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f8",
      }}
    >
      <Card sx={{ width: 460, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} alignItems="center">
            <UploadFileIcon fontSize="large" color="primary" />
            <Typography variant="h5" fontWeight={600}>
              SAP Anomaly Detection
            </Typography>

            {loading && <LinearProgress sx={{ width: "100%" }} />}

            {error && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {error}
              </Alert>
            )}

            <Button
              variant="outlined"
              component="label"
              fullWidth
              disabled={loading}
            >
              {file ? file.name : "Select CSV file"}
              <input
                ref={fileInputRef}
                hidden
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
            </Button>

            <Button
              variant="contained"
              fullWidth
              disabled={!file || loading}
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
