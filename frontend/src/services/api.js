import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 120000,
});

/**
 * Extract & normalize FastAPI error.detail
 */
function extractErrorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;

    // FastAPI có thể trả string hoặc list
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).join(", ");
    }

    return detail;
  }

  if (error.request) {
    return "Cannot connect to backend service";
  }

  return error.message || "Unknown error occurred";
}

export const scoreCSV = async ({
  file,
  page = 1,
  pageSize = 20,
  percentile = 95,
  onProgress,
}) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post(
      `/score_csv?page=${page}&page_size=${pageSize}&percentile=${percentile}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (!e.total || typeof onProgress !== "function") return;
          onProgress(Math.round((e.loaded * 100) / e.total));
        },
      }
    );

    return res.data;
  } catch (err) {
    const message = extractErrorMessage(err);
    throw new Error(message);
  }
};

export default api;
