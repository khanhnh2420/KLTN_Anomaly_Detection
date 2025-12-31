import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
} from "@mui/material";

export default function MetricCard({
  label,
  value,
  unit,
  hint,
  subHint,
  highlight = false,
}) {
  return (
    <Card
      sx={{
        flex: 1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: highlight ? "error.light" : "divider",
        bgcolor: highlight ? "rgba(244,67,54,0.035)" : "#fff",
      }}
    >
      <CardContent sx={{ px: 2, py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="stretch">
          {/* LEFT: Main metric */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: 1,
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              {label}
            </Typography>

            <Stack direction="row" alignItems="baseline" spacing={0.75}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  letterSpacing: -0.5,
                }}
                color={highlight ? "error.main" : "text.primary"}
              >
                {value}
              </Typography>

              {unit && (
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                >
                  {unit}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* RIGHT: Context */}
          <Box
            sx={{
              flex: 1,
              pl: 2,
              borderLeft: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                lineHeight: 1.4,
              }}
            >
              {hint}
            </Typography>

            {subHint && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.disabled",
                }}
              >
                {subHint}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
