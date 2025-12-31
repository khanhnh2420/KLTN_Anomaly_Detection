import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function ErrorState({ error, onRetry }) {
  if (!error) return null;

  return (
    <Card sx={{ borderLeft: "6px solid #d32f2f" }}>
      <CardContent>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <ErrorOutlineIcon color="error" fontSize="large" />
          <Box>
            <Typography variant="h6" fontWeight={700} color="error">
              {error.title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {error.description}
            </Typography>

            {error.hint && (
              <Typography
                variant="caption"
                sx={{ mt: 1, display: "block", color: "text.secondary" }}
              >
                {error.hint}
              </Typography>
            )}
          </Box>
        </Box>

        {onRetry && (
          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 2 }}
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
