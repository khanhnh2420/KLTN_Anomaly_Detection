import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Slider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { scoreCSV } from "../services/api";
import LoadingScreen from "../components/LoadingScreen";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import debounce from "lodash.debounce";

export default function ResultPage({ file, onBack }) {
  /* ===================== STATE ===================== */
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const minRef = useRef(null);
  const maxRef = useRef(null);

  const [percentile, setPercentile] = useState(95);
  const [percentileDraft, setPercentileDraft] = useState(95); // slider
  const [threshold, setThreshold] = useState(null);

  /* ===================== FETCH PAGE ===================== */
  const fetchPage = async (page, pageSize, currentPercentile = percentile) => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await scoreCSV({
        file,
        page,
        pageSize,
        percentile: currentPercentile,
      });

      const dataWithId = res.data.map((r, i) => ({
        id: (page - 1) * pageSize + i + 1,
        ...r,
      }));

      setRows(dataWithId);
      setMeta(res.meta);
      setThreshold(res.threshold?.value ?? null);

      // Build columns dynamically (chỉ 1 lần)
      if (columns.length === 0 && res.data.length > 0) {
        const dynamicCols = Object.keys(res.data[0]).map((key) => {
          if (key === "anomaly_scored") {
            return {
              field: key,
              headerName: "Score",
              flex: 1,
              renderCell: (p) => (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                    borderRadius: 1,
                    fontWeight: 600,
                    bgcolor: getRowColor(p.value),
                  }}
                >
                  {p.value.toFixed(4)}
                </Box>
              ),
            };
          }

          if (key === "is_anomaly") {
            return {
              field: key,
              headerName: "Prediction",
              width: 140,
              renderCell: (p) =>
                p.value === 1 ? (
                  <Chip label="Anomaly" color="error" size="small" />
                ) : (
                  <Chip label="Normal" color="success" size="small" />
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

        setColumns([{ field: "id", headerName: "#", width: 80 }, ...dynamicCols]);
      }

      const scores = res.data.map((r) => r.anomaly_scored);
      minRef.current = minRef.current === null ? Math.min(...scores) : minRef.current;
      maxRef.current = maxRef.current === null ? Math.max(...scores) : maxRef.current;
    } finally {
      setLoading(false);
    }
  };

  /* ===================== DEBOUNCED PERCENTILE ===================== */
  const debouncedPercentileChange = useCallback(
    debounce((v) => {
      setPercentile(v);
      setPaginationModel((prev) => ({ ...prev, page: 0 })); // reset page
      fetchPage(1, paginationModel.pageSize, v);
    }, 250),
    [file, paginationModel.pageSize]
  );

  /* ===================== EFFECT ===================== */
  useEffect(() => {
    if (!file) return;
    minRef.current = null;
    maxRef.current = null;
    setColumns([]);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    fetchPage(1, paginationModel.pageSize);
  }, [file]);

  /* ===================== COLOR ===================== */
  const getRowColor = (score) => {
    if (minRef.current === null) return "#fff";
    const s = Math.log(score + 1);
    const min = Math.log(minRef.current + 1);
    const max = Math.log(maxRef.current + 1);
    let t = (s - min) / (max - min || 1);
    t = Math.pow(Math.min(1, Math.max(0, t)), 0.75);
    return `hsl(${120 * (1 - t)}, 85%, 50%)`;
  };

  /* ===================== DERIVED ===================== */
  const anomalyCount = useMemo(
    () => rows.filter((r) => r.is_anomaly === 1).length,
    [rows]
  );

  const pieData = [
    { name: "Anomaly", value: anomalyCount },
    { name: "Normal", value: rows.length - anomalyCount },
  ];

  const COLORS = ["#f44336", "#4caf50"];

  /* ===================== UI ===================== */
  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {loading && <LoadingScreen text="Scoring anomalies..." />}

      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="h4" fontWeight={700}>
            Detection Result
          </Typography>
          <Button
            startIcon={<UploadFileIcon />}
            variant="outlined"
            onClick={onBack}
          >
            Upload new file
          </Button>
        </Stack>

        {/* KPI */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Kpi title="Total Records" value={meta.total_rows ?? 0} />
          <Kpi title="Detected Anomalies" value={anomalyCount} color="error" />
          <Kpi
            title="Threshold"
            value={`P${percentile}`}
            subtitle={`Score ≥ ${threshold?.toFixed(4) ?? "—"}`}
          />
        </Stack>

        {/* Threshold + Distribution */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6">Anomaly Threshold Configuration</Typography>
              <Slider
                value={percentileDraft}
                min={90}
                max={99.9}
                step={0.1}
                marks={[
                  { value: 90, label: "P90" },
                  { value: 95, label: "P95" },
                  { value: 99, label: "P99" },
                ]}
                valueLabelDisplay="auto"
                onChange={(_, v) => setPercentileDraft(v)}
                onChangeCommitted={(_, v) => debouncedPercentileChange(v)}
              />
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6">Anomaly Distribution</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={90} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Stack>

        {/* TABLE */}
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
      </Stack>
    </Box>
  );
}

/* ===================== SMALL COMPONENT ===================== */
function Kpi({ title, value, subtitle, color }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Typography variant="overline">{title}</Typography>
        <Typography variant="h4" fontWeight={700} color={color}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
