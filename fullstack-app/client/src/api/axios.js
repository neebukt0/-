import axios from 'axios';

// Создаем единый экземпляр Axios
export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // КРИТИЧЕСКИ ВАЖНО: Принуждает Axios отправлять/принимать HttpOnly куки!
});