import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stack,
  LinearProgress,
  Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

export default function UploadPage({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }
    setError("");
    onUploaded(file);
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

            {error && <Alert severity="error">{error}</Alert>}

            <Button variant="outlined" component="label" fullWidth>
              {file ? file.name : "Select CSV file"}
              <input
                hidden
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Button>

            <Button
              variant="contained"
              fullWidth
              disabled={!file}
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
