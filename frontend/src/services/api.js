import axios from "axios";


const api = axios.create({
baseURL: import.meta.env.VITE_API_URL,
});


export const scoreCSV = async (file, page = 1, pageSize = 20) => {
const formData = new FormData();
formData.append("file", file);


const res = await api.post(
`/score_csv?page=${page}&page_size=${pageSize}`,
formData,
{ headers: { "Content-Type": "multipart/form-data" } }
);


return res.data;
};


export default api;