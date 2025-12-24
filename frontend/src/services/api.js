import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const scoreCsv = async (file, page, pageSize) => {
  const form = new FormData();
  form.append("file", file);

  const res = await axios.post(
    `${API}/score_csv?page=${page}&page_size=${pageSize}`,
    form
  );

  return res.data;
};
