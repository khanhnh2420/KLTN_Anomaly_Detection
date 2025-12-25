import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingScreen({ text = "Loading..." }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        bgcolor: "rgba(255,255,255,0.75)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress />
      <Typography mt={2} fontWeight={500}>
        {text}
      </Typography>
      <Typography mt={1} color="text.secondary" fontSize={14}>
        Elapsed time: {seconds}s
      </Typography>
    </Box>
  );
}
