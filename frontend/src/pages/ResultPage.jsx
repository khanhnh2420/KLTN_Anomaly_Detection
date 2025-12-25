import { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { scoreCSV } from "../services/api";
import LoadingScreen from "../components/LoadingScreen";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

export default function ResultPage({ file, onBack }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });

  const minRef = useRef(null);
  const maxRef = useRef(null);

  const [topAnomalies, setTopAnomalies] = useState([]);
  const [pieData, setPieData] = useState([]);

  const fetchPage = async (page, pageSize) => {
    setLoading(true);
    try {
      const res = await scoreCSV(file, page, pageSize);

      const scores = res.data.map((r) => r.anomaly_scored);
      const pageMin = Math.min(...scores);
      const pageMax = Math.max(...scores);

      minRef.current =
        minRef.current === null ? pageMin : Math.min(minRef.current, pageMin);
      maxRef.current =
        maxRef.current === null ? pageMax : Math.max(maxRef.current, pageMax);

      setRows(
        res.data.map((r, i) => ({
          id: (page - 1) * pageSize + i + 1,
          ...r,
        }))
      );

      setMeta(res.meta);

      // Top 10 Anomalies
      const sortedTop = [...res.data]
        .sort((a, b) => b.anomaly_scored - a.anomaly_scored)
        .slice(0, 10);
      setTopAnomalies(sortedTop);

      // Pie chart: Anomaly / Normal
      const anomalyCount = res.data.filter((r) => r.is_anomaly === 1).length;
      const normalCount = res.data.length - anomalyCount;
      setPieData([
        { name: "Anomaly", value: anomalyCount },
        { name: "Normal", value: normalCount },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!file) return;
    minRef.current = null;
    maxRef.current = null;
    fetchPage(1, paginationModel.pageSize);
  }, [file]);

  const getRowColor = (score) => {
    if (minRef.current === null) return "#fff";
    const s = Math.log(score + 1);
    const min = Math.log(minRef.current + 1);
    const max = Math.log(maxRef.current + 1);
    let t = (s - min) / (max - min || 1);
    t = Math.min(1, Math.max(0, t));
    t = Math.pow(t, 0.75);
    const hue = 120 * (1 - t); // đỏ --> xanh
    return `hsl(${hue}, 85%, 50%)`;
  };

  const columns = [
    { field: "id", headerName: "#", width: 80 },
    { field: "BELNR", headerName: "BELNR", flex: 1 },
    {
      field: "anomaly_scored",
      headerName: "Score",
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            px: 1,
            borderRadius: 1,
            fontWeight: 600,
            bgcolor: getRowColor(params.value),
          }}
        >
          {params.value.toFixed(4)}
        </Box>
      ),
    },
    {
      field: "is_anomaly",
      headerName: "Prediction",
      width: 140,
      renderCell: (p) =>
        p.value === 1 ? (
          <Chip label="Anomaly" color="error" size="small" />
        ) : (
          <Chip label="Normal" color="success" size="small" />
        ),
    },
  ];

  const COLORS = ["#f44336", "#4caf50"]; // Pie chart colors

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {loading && <LoadingScreen text="Scoring anomalies..." />}

      <Stack spacing={3}>
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

        {/* Charts */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          {/* Top 10 Anomalies */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Top 10 Anomalies
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topAnomalies}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="BELNR"
                    width={100}
                    tick={{ fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(value) => new Intl.NumberFormat().format(value)}
                  />
                  <Bar
                    dataKey="anomaly_scored"
                    barSize={16}
                    radius={[5, 5, 5, 5]}
                  >
                    <LabelList
                      dataKey="anomaly_scored"
                      position="right"
                      formatter={(value) =>
                        new Intl.NumberFormat().format(value)
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie chart Anomaly/Normal */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Anomaly vs Normal
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}`, `${name}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Stack>

        {/* Data Table */}
        <Card>
          <CardContent>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              paginationMode="server"
              rowCount={meta.total_rows ?? 0}
              paginationModel={paginationModel}
              onPaginationModelChange={(model) => {
                setPaginationModel(model);
                fetchPage(model.page + 1, model.pageSize);
              }}
              pageSizeOptions={[20, 50, 100]}
            />
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
