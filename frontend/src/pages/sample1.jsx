import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { scoreCSV } from "../services/api";
import AnomalyChart from "../components/AnomalyChart";

export default function ResultPage({ file, onBack, onDataReady }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  const pageSize = 20;

  // dùng để tính percentile
  const [sortedScores, setSortedScores] = useState([]);

  // ================= LOAD DATA =================
  useEffect(() => {
    if (file) {
      fetchPage(1);
      onDataReady?.();
    }
  }, [file]);

  const fetchPage = async (p) => {
    try {
      const res = await scoreCSV(file, p, pageSize);

      // log-scale cho ổn định
      const logScores = res.data.map(
        (r) => Math.log(r.anomaly_scored + 1)
      );

      // sort để tính percentile
      const sorted = [...logScores].sort((a, b) => a - b);
      setSortedScores(sorted);

      setRows(
        res.data.map((r, idx) => ({
          id: (p - 1) * pageSize + idx + 1,
          ...r
        }))
      );

      setMeta(res.meta);
      setError(null);
    } catch {
      setError("Failed to score CSV");
    }
  };

  // ================= PERCENTILE =================
  const getPercentile = (value) => {
    if (sortedScores.length === 0) return 0;
    let left = 0;
    let right = sortedScores.length - 1;

    // binary search (nhanh, chuyên nghiệp)
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (sortedScores[mid] < value) left = mid + 1;
      else right = mid;
    }

    return left / (sortedScores.length - 1 || 1);
  };

  // ================= COLOR BY RANK =================
  // percentile = 1 → đỏ đậm
  // percentile = 0 → xanh đậm
  const getColorByPercentile = (score) => {
    const s = Math.log(score + 1);
    const p = getPercentile(s);

    // Hue: 0 (red) → 120 (green)
    const hue = 120 * (1 - p);

    return `hsl(${hue}, 85%, 45%)`;
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 80
    },
    {
      field: "BELNR",
      headerName: "Document Number",
      flex: 1
    },
    {
      field: "anomaly_scored",
      headerName: "Anomaly Score",
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            px: 1.2,
            display: "flex",
            alignItems: "center",
            backgroundColor: getColorByPercentile(params.value),
            borderRadius: 1,
            fontWeight: 600,
            color: "#111"
          }}
        >
          {params.value.toFixed(4)}
        </Box>
      )
    },
    {
      field: "is_anomaly",
      headerName: "Prediction",
      width: 150,
      align: "center",
      renderCell: (params) =>
        params.value === 1 ? (
          <Chip label="Anomaly" color="error" size="small" />
        ) : (
          <Chip label="Normal" color="success" size="small" />
        )
    }
  ];

  // ================= RENDER =================
  return (
    <Box sx={{ p: 4, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Detection Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              File: {file?.name} | Total rows: {meta.total_rows ?? 0}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={onBack}
          >
            Upload New Data
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {/* Chart */}
        <Card>
          <CardContent>
            <Typography fontWeight={600} gutterBottom>
              Score Distribution
            </Typography>
            <AnomalyChart rows={rows} />
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            paginationMode="server"
            rowCount={meta.total_rows ?? 0}
            page={page - 1}
            pageSize={pageSize}
            onPageChange={(p) => {
              setPage(p + 1);
              fetchPage(p + 1);
            }}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": {
                alignItems: "center"
              }
            }}
          />
        </Card>

        {/* Legend */}
        <Typography variant="caption" color="text.secondary">
          Color scale based on percentile: Top anomalies → red, Normal → green
        </Typography>
      </Stack>
    </Box>
  );
}
