import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 120000,
});

const extractErrorMessage = (error) => {
  if (error.response?.data?.detail) return error.response.data.detail;
  if (error.request) return "Cannot connect to backend";
  return error.message;
};

export const scoreCSV = async ({ file, page, pageSize }) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post(
      `/score_csv?page=${page}&page_size=${pageSize}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
};

export const downloadScoreCSV = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/score_csv_download", formData, {
    responseType: "blob",
  });

  return res.data;
};

export default api;
