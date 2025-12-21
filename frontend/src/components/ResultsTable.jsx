import React from "react";
import { DataGrid, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f3f3f3", fontWeight: 600 },
  "& .MuiDataGrid-cell": { fontSize: 14 },
  "& .anomaly-row": {
    backgroundColor: "rgba(255,77,77,0.2)",
    "&:hover": { backgroundColor: "rgba(255,77,77,0.35)" }
  },
}));

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const ResultsTable = ({ results, onRowHover }) => {
  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "score", headerName: "Score", width: 150, type: "number" },
    {
      field: "is_anomaly",
      headerName: "Anomaly",
      width: 150,
      type: "boolean",
      renderCell: (params) => (
        <span style={{ color: params.value ? "#d32f2f" : "#2e7d32", fontWeight: 600 }}>
          {params.value ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  return (
    <div style={{ height: 500, width: "100%", marginTop: 20 }}>
      <StyledDataGrid
        rows={results}
        columns={columns}
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100, results.length]}
        disableSelectionOnClick
        getRowClassName={(params) => (params.row.is_anomaly ? "anomaly-row" : "")}
        components={{ Toolbar: CustomToolbar }}
        onRowOver={(params) => onRowHover && onRowHover(params.row)}
      />
    </div>
  );
};

export default ResultsTable;
