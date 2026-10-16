import api from "./axios";

export async function uploadImage(file, type) {
  const data = new FormData();
  data.append("image", file);
  const response = await api.post(`/uploads/${type}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
