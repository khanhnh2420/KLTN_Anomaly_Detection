import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 120000,
});

export const scoreCSV = async (
  file,
  page = 1,
  pageSize = 20,
  onProgress
) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `/score_csv?page=${page}&page_size=${pageSize}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }
  );

  return res.data;
};

export default api;
