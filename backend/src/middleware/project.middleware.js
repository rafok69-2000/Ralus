import prisma from '../lib/prisma.js';

export async function isProjectMember(req, res, next) {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true, role: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isMember =
      project.ownerId === userId ||
      project.members.some((m) => m.userId === userId);

    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function isProjectAdmin(req, res, next) {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const member = project.members.find((m) => m.userId === userId);
    const isAdmin = project.ownerId === userId || member?.role === 'ADMIN';

    if (!isAdmin) {
      return res.status(403).json({ message: 'Se requieren permisos de administrador' });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
