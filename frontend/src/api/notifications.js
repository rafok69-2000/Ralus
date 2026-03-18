import api from './axios.js';

export const getNotifications = () =>
  api.get('/notifications').then((r) => r.data);

export const markAsRead = (id) =>
  api.put(`/notifications/${id}/read`);

export const markAllAsRead = () =>
  api.put('/notifications/read-all');

export function connectSSE(onNotification) {
  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_URL}/notifications/stream?token=${token}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'NEW_NOTIFICATION') {
      onNotification(data.notification);
    }
  };

  eventSource.onerror = () => eventSource.close();

  return eventSource;
}
