import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { scoreCSV } from "../services/api";
import LoadingScreen from "../components/LoadingScreen";
import MetricCard from "../components/MetricCard";
import ErrorState from "../components/ErrorState";
import { errorFormatter } from "../utils/errorFormatter";

const formatWithComma = (v) => {
  if (v === null || v === undefined || isNaN(v)) return "-";
  return v.toLocaleString("en-US");
};

export default function ResultPage({ file, onBack }) {
  /* ===================== STATE ===================== */
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  /* ===================== FETCH ===================== */
  const fetchPage = async (page, pageSize) => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const res = await scoreCSV({ file, page, pageSize });

      const dataWithId = res.data.map((r, i) => ({
        id: (page - 1) * pageSize + i + 1, // rank
        ...r,
      }));

      setRows(dataWithId);
      setMeta(res.meta);

      if (columns.length === 0 && res.data.length > 0) {
        const dynamicCols = Object.keys(res.data[0]).map((key) => {
          if (key === "DMBTR" || key === "WRBTR") {
            return {
              field: key,
              headerName: key,
              flex: 1,
              renderCell: (p) => formatWithComma(p.value),
            };
          }

          if (key === "anomaly_score") {
            return {
              field: key,
              headerName: "Anomaly Score",
              flex: 1,
              renderCell: (p) => (
                <Typography fontWeight={700}>
                  {formatWithComma(p.value)}
                </Typography>
              ),
            };
          }

          return {
            field: key,
            headerName: key,
            flex: 1,
            minWidth: 120,
          };
        });

        setColumns([{ field: "id", headerName: "Rank", width: 90 }, ...dynamicCols]);
      }

    } catch (err) {
      setError(errorFormatter(err));
      setRows([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  };

  /* ===================== EFFECT ===================== */
  useEffect(() => {
    if (!file) return;
    setColumns([]);
    setPaginationModel((p) => ({ ...p, page: 0 }));
    fetchPage(1, paginationModel.pageSize);
  }, [file]);

  /* ===================== UI ===================== */
  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {loading && <LoadingScreen text="Scoring transactions..." />}

      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>
            Anomaly Detection Results
          </Typography>
          <Button
            startIcon={<UploadFileIcon />}
            variant="outlined"
            onClick={onBack}
          >
            Upload new file
          </Button>
        </Stack>

        {/* Context explanation */}
        <Typography variant="body2" color="text.secondary">
          Records are ranked by anomaly score (higher = more abnormal). Scores are relative within this dataset and intended for prioritization.
        </Typography>

        {error && (
          <ErrorState
            error={error}
            onRetry={() =>
              fetchPage(paginationModel.page + 1, paginationModel.pageSize)
            }
          />
        )}

        {!error && (
          <>
            {/* KPI */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <MetricCard
                label="TOTAL RECORDS"
                value={meta.total_rows ?? 0}
                unit="rows"
              />
            </Stack>

            {/* Table */}
            <Card>
              <CardContent>
                <DataGrid
                  autoHeight
                  rows={rows}
                  columns={columns}
                  paginationMode="server"
                  rowCount={meta.total_rows ?? 0}
                  paginationModel={paginationModel}
                  onPaginationModelChange={(m) => {
                    setPaginationModel(m);
                    fetchPage(m.page + 1, m.pageSize);
                  }}
                  loading={loading}
                  pageSizeOptions={[20, 50, 100]}
                />
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </Box>
  );
}
