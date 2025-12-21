import React from "react";
import { Box, Slider, TextField, FormControlLabel, Checkbox } from "@mui/material";

const FilterPanel = ({
  scoreRange,
  setScoreRange,
  showAnomaliesOnly,
  setShowAnomaliesOnly,
  searchId,
  setSearchId
}) => {
  return (
    <Box sx={{ display: "flex", gap: 4, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
      <Box sx={{ width: 250 }}>
        <span>Score Range:</span>
        <Slider
          value={scoreRange}
          onChange={(e, newValue) => setScoreRange(newValue)}
          valueLabelDisplay="auto"
          min={0}
          max={1}
          step={0.01}
        />
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={showAnomaliesOnly}
            onChange={(e) => setShowAnomaliesOnly(e.target.checked)}
          />
        }
        label="Show Anomalies Only"
      />

      <TextField
        label="Search ID"
        variant="outlined"
        size="small"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
      />
    </Box>
  );
};

export default FilterPanel;
