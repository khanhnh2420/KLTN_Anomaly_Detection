import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingScreen({ text = "Processing..." }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(4px)",
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress size={80} thickness={4} />
        <Box
          sx={{
            inset: 0, position: 'absolute', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Typography variant="caption" fontWeight="bold">{seconds}s</Typography>
        </Box>
      </Box>
      <Typography sx={{ mt: 3, fontWeight: 500 }} fontSize={18}>{text}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Elapsed time: {formatTime(seconds)}
      </Typography>
    </Box>
  );
}