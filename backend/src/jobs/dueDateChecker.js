import prisma from '../lib/prisma.js';
import { createNotification } from '../utils/createNotification.js';

async function checkDueDates() {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const cards = await prisma.card.findMany({
      where: {
        dueDate: { gte: now, lte: cutoff },
        assignedToId: { not: null },
      },
      include: { column: { select: { projectId: true } } },
    });

    if (cards.length === 0) return;

    const existing = await prisma.notification.findMany({
      where: {
        type: 'CARD_DUE_SOON',
        cardId: { in: cards.map((c) => c.id) },
        createdAt: { gte: startOfDay },
      },
      select: { cardId: true, userId: true },
    });

    const alreadyNotified = new Set(existing.map((n) => `${n.cardId}:${n.userId}`));

    for (const card of cards) {
      const key = `${card.id}:${card.assignedToId}`;
      if (!alreadyNotified.has(key)) {
        await createNotification({
          userId: card.assignedToId,
          type: 'CARD_DUE_SOON',
          message: `La tarjeta "${card.title}" vence en menos de 24 horas`,
          cardId: card.id,
          projectId: card.column.projectId,
        });
      }
    }
  } catch (error) {
    console.error('Error en dueDateChecker:', error.message);
  }
}

// Run immediately on startup, then every hour
checkDueDates();
setInterval(checkDueDates, 60 * 60 * 1000);
