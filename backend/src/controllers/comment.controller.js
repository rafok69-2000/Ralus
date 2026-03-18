import prisma from '../lib/prisma.js';

const AUTHOR_SELECT = { select: { id: true, name: true, email: true } };

async function getProjectMembership(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) return { isAdmin: false };
  const member = project.members.find((m) => m.userId === userId);
  const isAdmin = project.ownerId === userId || member?.role === 'ADMIN';
  return { isAdmin };
}

export async function getComments(req, res) {
  try {
    const { cardId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'asc' },
      include: { author: AUTHOR_SELECT },
    });

    return res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function createComment(req, res) {
  try {
    const { cardId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'El contenido del comentario es requerido' });
    }

    const comment = await prisma.comment.create({
      data: { content: content.trim(), cardId, authorId: req.user.id },
      include: { author: AUTHOR_SELECT },
    });

    return res.status(201).json({ comment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function updateComment(req, res) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'El contenido del comentario es requerido' });
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Solo el autor puede editar este comentario' });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: { author: AUTHOR_SELECT },
    });

    return res.status(200).json({ comment: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function deleteComment(req, res) {
  try {
    const { projectId, commentId } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' });
    }

    const { isAdmin } = await getProjectMembership(projectId, req.user.id);

    if (comment.authorId !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Solo el autor o un ADMIN puede eliminar este comentario' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return res.status(200).json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
