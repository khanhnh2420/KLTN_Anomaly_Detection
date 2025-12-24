import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Button, Stack, Alert } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { scoreCSV } from "../services/api";
import AnomalyChart from "../components/AnomalyChart";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function ResultPage({ file, onBack, onDataReady }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const pageSize = 20;

  useEffect(() => {
    const initFetch = async () => {
      await fetchPage(1);
      if (onDataReady) onDataReady();
    };
    initFetch();
  }, [file]);

  const fetchPage = async (p) => {
    try {
      const res = await scoreCSV(file, p, pageSize);
      const scores = res.data.map(r => r.anomaly_scored);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      const withId = res.data.map((r, idx) => {
        const val = Math.log(r.anomaly_scored + 1);
        const minVal = Math.log(minScore + 1);
        const maxVal = Math.log(maxScore + 1);
        const intensity = (val - minVal) / (maxVal - minVal || 1);

        const rColor = Math.round(255 * intensity);
        const gColor = Math.round(255 * (1 - intensity));
        const bColor = 0;

        return {
          id: (p - 1) * pageSize + idx + 1,
          ...r,
          bgColor: `rgba(${rColor},${gColor},${bColor},0.3)`,
          intensity
        };
      });

      setRows(withId);
      setMeta(res.meta);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to score CSV");
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "BELNR", headerName: "Document Number (BELNR)", flex: 1 },
    {
      field: "anomaly_scored",
      headerName: "Anomaly Score",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ width: "100%", height: "100%", bgcolor: params.row.bgColor, px: 1, display: 'flex', alignItems: 'center' }}>
          {params.value?.toFixed(4)}
        </Box>
      )
    }
  ];

  // Chuẩn bị dữ liệu cho PieChart
  const pieData = () => {
    if (!rows.length) return [];
    let high = 0, mid = 0, low = 0;
    rows.forEach(r => {
      if (r.intensity > 0.66) high++;
      else if (r.intensity > 0.33) mid++;
      else low++;
    });
    return [
      { name: "Low", value: low, color: "#4caf50" },     // xanh
      { name: "Medium", value: mid, color: "#ffeb3b" },  // vàng
      { name: "High", value: high, color: "#f44336" }    // đỏ
    ];
  };

  return (
    <Box sx={{ p: 4, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary">
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
            sx={{ borderRadius: 2 }}
          >
            Upload New Data
          </Button>
        </Stack>

        {error && <Alert severity="error" variant="filled">{error}</Alert>}

        {/* Visual Analytics */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Card sx={{ flex: 2, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Score Distribution Trend
              </Typography>
              <AnomalyChart rows={rows} />
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Statistics Summary
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="caption">Avg Score</Typography>
                  <Typography variant="h5" color="secondary.main">
                    {(rows.reduce((a, b) => a + b.anomaly_scored, 0) / (rows.length || 1)).toFixed(3)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption">Potential Anomalies</Typography>
                  <Typography variant="h5" color="error.main">
                    {rows.filter(r => r.intensity > 0.66).length}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData()}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        label
                      >
                        {pieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Typography variant="caption">Score distribution: xanh → vàng → đỏ</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* DataGrid */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="h6" fontWeight={600}>Detailed Data Log</Typography>
          </Box>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            paginationMode="server"
            page={page - 1}
            pageSize={pageSize}
            rowCount={meta.total_rows ?? 0}
            onPageChange={(p) => { setPage(p + 1); fetchPage(p + 1); }}
            rowHeight={50}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8f9fa', fontWeight: 'bold' },
              '& .MuiDataGrid-cell:focus': { outline: 'none' }
            }}
          />
        </Card>
      </Stack>
    </Box>
  );
}
