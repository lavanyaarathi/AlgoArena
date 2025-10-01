/*import axios from 'axios';

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}`, // Backend URL
});

export default instance;
*/
import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // optional, if you use cookies
});

export default instance;
