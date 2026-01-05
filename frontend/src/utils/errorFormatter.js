export function errorFormatter(err) {
  const detail = err?.response?.data?.detail;

  if (!detail) {
    return {
      title: "Unexpected Error",
      description: "An unknown error occurred.",
      hint: "Please try again later.",
    };
  }

  switch (detail.code) {
    case "CSV_READ_FAILED":
      return {
        title: "Unreadable CSV File",
        description: detail.message,
        hint: "Upload a valid UTF-8 encoded CSV file.",
      };

    case "MISSING_COLUMNS":
      return {
        title: "Invalid CSV Schema",
        description: `Missing required columns: ${detail.columns.join(", ")}`,
        hint: "Ensure the CSV follows SAP transaction schema.",
      };

    case "SCORING_FAILED":
      return {
        title: "Model Execution Error",
        description: detail.message,
        hint: "The anomaly detection model failed to process this file.",
      };

    case "INVALID_PAGE":
      return {
        title: "Pagination Error",
        description: detail.message,
        hint: "Please refresh the page and try again.",
      };

    default:
      return {
        title: "Processing Error",
        description: detail.message || "An error occurred.",
        hint: "Please retry.",
      };
  }
}
