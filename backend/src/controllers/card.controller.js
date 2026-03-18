import prisma from '../lib/prisma.js';
import { createNotification } from '../utils/createNotification.js';

const CARD_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  labels: true,
};

async function getProjectMembership(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return { project: null, isMember: false, isAdmin: false };

  const member = project.members.find((m) => m.userId === userId);
  const isOwner = project.ownerId === userId;
  const isMember = isOwner || !!member;
  const isAdmin = isOwner || member?.role === 'ADMIN';

  return { project, isMember, isAdmin };
}

function isProjectMember(project, userId) {
  if (project.ownerId === userId) return true;
  return project.members.some((m) => m.userId === userId);
}

export async function createCard(req, res) {
  try {
    const { projectId, columnId } = req.params;
    const { title, description, assignedToId, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'El título de la tarjeta es requerido' });
    }

    const { project, isMember } = await getProjectMembership(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (assignedToId && !isProjectMember(project, assignedToId)) {
      return res.status(400).json({ message: 'El usuario no es miembro del proyecto' });
    }

    let parsedDueDate;
    if (dueDate !== undefined && dueDate !== null) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'La fecha límite no es válida' });
      }
    }

    const column = await prisma.column.findFirst({ where: { id: columnId, projectId } });
    if (!column) {
      return res.status(404).json({ message: 'Columna no encontrada' });
    }

    const count = await prisma.card.count({ where: { columnId } });

    const card = await prisma.card.create({
      data: {
        title,
        description,
        columnId,
        position: count + 1,
        createdById: req.user.id,
        ...(assignedToId !== undefined ? { assignedToId } : {}),
        ...(dueDate !== undefined ? { dueDate: parsedDueDate ?? null } : {}),
      },
      include: CARD_INCLUDE,
    });

    return res.status(201).json({ card });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getCards(req, res) {
  try {
    const { projectId, columnId } = req.params;

    const { isMember } = await getProjectMembership(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const column = await prisma.column.findFirst({ where: { id: columnId, projectId } });
    if (!column) {
      return res.status(404).json({ message: 'Columna no encontrada' });
    }

    const cards = await prisma.card.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
      include: CARD_INCLUDE,
    });

    return res.status(200).json({ cards });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function updateCard(req, res) {
  try {
    const { projectId, columnId, cardId } = req.params;
    const { title, description, assignedToId, dueDate } = req.body;

    const { project, isMember } = await getProjectMembership(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (assignedToId && !isProjectMember(project, assignedToId)) {
      return res.status(400).json({ message: 'El usuario no es miembro del proyecto' });
    }

    let parsedDueDate;
    if (dueDate !== undefined && dueDate !== null) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'La fecha límite no es válida' });
      }
    }

    const card = await prisma.card.findFirst({ where: { id: cardId, columnId } });
    if (!card) {
      return res.status(404).json({ message: 'Tarjeta no encontrada' });
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(assignedToId !== undefined ? { assignedToId } : {}),
        ...(dueDate !== undefined ? { dueDate: parsedDueDate ?? null } : {}),
      },
      include: CARD_INCLUDE,
    });

    if (assignedToId && assignedToId !== card.assignedToId && assignedToId !== req.user.id) {
      await createNotification({
        userId: assignedToId,
        type: 'CARD_ASSIGNED',
        message: `${req.user.name} te asignó la tarjeta "${card.title}"`,
        cardId: card.id,
        projectId,
      });
    }

    return res.status(200).json({ card: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function moveCard(req, res) {
  try {
    const { projectId, columnId, cardId } = req.params;
    const { targetColumnId, position } = req.body;

    const { isMember } = await getProjectMembership(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const card = await prisma.card.findFirst({ where: { id: cardId, columnId } });
    if (!card) {
      return res.status(404).json({ message: 'Tarjeta no encontrada' });
    }

    const targetColumn = await prisma.column.findFirst({
      where: { id: targetColumnId, projectId },
    });
    if (!targetColumn) {
      return res.status(404).json({ message: 'Columna destino no encontrada' });
    }

    const [updated] = await prisma.$transaction([
      // Mover la tarjeta a la columna destino con la nueva posición
      prisma.card.update({
        where: { id: cardId },
        data: { columnId: targetColumnId, position },
      }),
      // Normalizar posiciones en columna origen (excluir la tarjeta movida)
      ...( columnId !== targetColumnId
        ? [prisma.$executeRaw`
            UPDATE "Card"
            SET position = position - 1
            WHERE "columnId" = ${columnId}
              AND position > ${card.position}
          `]
        : []
      ),
    ]);

    return res.status(200).json({ card: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function reorderCards(req, res) {
  try {
    const { projectId, columnId } = req.params;
    const { cards } = req.body;

    const { isMember } = await getProjectMembership(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const column = await prisma.column.findFirst({ where: { id: columnId, projectId } });
    if (!column) {
      return res.status(404).json({ message: 'Columna no encontrada' });
    }

    const cardIds = cards.map((c) => c.id);
    const existingCards = await prisma.card.findMany({
      where: { id: { in: cardIds }, columnId },
      select: { id: true },
    });

    if (existingCards.length !== cardIds.length) {
      return res.status(404).json({ message: 'Alguna tarjeta no pertenece a esta columna' });
    }

    await prisma.$transaction(
      cards.map(({ id, position }) =>
        prisma.card.update({ where: { id }, data: { position } })
      )
    );

    return res.status(200).json({ message: 'Tarjetas reordenadas correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function deleteCard(req, res) {
  try {
    const { projectId, columnId, cardId } = req.params;

    const { isMember, isAdmin } = await getProjectMembership(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const card = await prisma.card.findFirst({ where: { id: cardId, columnId } });
    if (!card) {
      return res.status(404).json({ message: 'Tarjeta no encontrada' });
    }

    if (card.createdById !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Solo el creador o un ADMIN puede eliminar esta tarjeta' });
    }

    await prisma.card.delete({ where: { id: cardId } });

    return res.status(200).json({ message: 'Tarjeta eliminada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
