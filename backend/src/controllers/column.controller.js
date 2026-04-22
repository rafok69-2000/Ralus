import prisma from '../lib/prisma.js';

async function getProjectAndCheckAccess(projectId, userId, requireAdmin = false) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) return { project: null, error: 404 };

  const member = project.members.find((m) => m.userId === userId);
  const isOwner = project.ownerId === userId;
  const isMember = isOwner || !!member;

  if (!isMember) return { project: null, error: 403 };

  if (requireAdmin) {
    const isAdmin = isOwner || member?.role === 'ADMIN';
    if (!isAdmin) return { project: null, error: 403 };
  }

  return { project, error: null };
}

export async function createColumn(req, res) {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre de la columna es requerido' });
    }

    const { project, error } = await getProjectAndCheckAccess(projectId, req.user.id, true);
    if (error === 404) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (error === 403) return res.status(403).json({ message: 'Acceso denegado' });

    const count = await prisma.column.count({ where: { projectId } });

    const column = await prisma.column.create({
      data: { name, projectId, position: count + 1 },
    });

    return res.status(201).json({ column });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getColumns(req, res) {
  try {
    const { projectId } = req.params;

    const { error } = await getProjectAndCheckAccess(projectId, req.user.id);
    if (error === 404) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (error === 403) return res.status(403).json({ message: 'Acceso denegado' });

    const columns = await prisma.column.findMany({
  where: { projectId },
  orderBy: { position: 'asc' },
  include: {
    cards: {
      orderBy: { position: 'asc' },
      include: {
        labels: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    },
  },
});

    return res.status(200).json({ columns });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function updateColumn(req, res) {
  try {
    const { projectId, columnId } = req.params;
    const { name } = req.body;

    const { error } = await getProjectAndCheckAccess(projectId, req.user.id, true);
    if (error === 404) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (error === 403) return res.status(403).json({ message: 'Acceso denegado' });

    const column = await prisma.column.findFirst({
      where: { id: columnId, projectId },
    });

    if (!column) {
      return res.status(404).json({ message: 'Columna no encontrada' });
    }

    const updated = await prisma.column.update({
      where: { id: columnId },
      data: { name },
    });

    return res.status(200).json({ column: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function reorderColumns(req, res) {
  try {
    const { projectId } = req.params;
    const { columns } = req.body;

    const { error } = await getProjectAndCheckAccess(projectId, req.user.id, true);
    if (error === 404) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (error === 403) return res.status(403).json({ message: 'Acceso denegado' });

    await prisma.$transaction(
      columns.map(({ id, position }) =>
        prisma.column.update({ where: { id }, data: { position } })
      )
    );

    return res.status(200).json({ message: 'Columnas reordenadas correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function deleteColumn(req, res) {
  try {
    const { projectId, columnId } = req.params;

    const { error } = await getProjectAndCheckAccess(projectId, req.user.id, true);
    if (error === 404) return res.status(404).json({ message: 'Proyecto no encontrado' });
    if (error === 403) return res.status(403).json({ message: 'Acceso denegado' });

    const column = await prisma.column.findFirst({
      where: { id: columnId, projectId },
    });

    if (!column) {
      return res.status(404).json({ message: 'Columna no encontrada' });
    }

    await prisma.column.delete({ where: { id: columnId } });

    return res.status(200).json({ message: 'Columna eliminada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
