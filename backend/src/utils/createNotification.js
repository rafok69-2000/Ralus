import prisma from '../lib/prisma.js';
import { sendToUser } from '../sse/sseManager.js';

export async function createNotification({ userId, type, message, cardId, projectId }) {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, message, cardId, projectId },
    });
    sendToUser(userId, { type: 'NEW_NOTIFICATION', notification });
  } catch (error) {
    console.error('Error creando notificación:', error.message);
  }
}
