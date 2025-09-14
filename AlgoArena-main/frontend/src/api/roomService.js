import axios from './axios'; // Import the configured Axios instance

export const createRoom = () => {
  return axios.post('/api/rooms', {}, {
    headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
    }
});
};

export const joinRoom = (roomId) => {
  return axios.get(`/api/rooms/${roomId}`, {
    headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
    }
});
};
