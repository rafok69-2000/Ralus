import prisma from '../lib/prisma.js';
import { sendInvitationEmail } from '../utils/sendInvitationEmail.js';
import { createNotification } from '../utils/createNotification.js';

export async function createProject(req, res) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre del proyecto es requerido' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
    });

    return res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getProjects(req, res) {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true, columns: true } },
      },
    });

    return res.status(200).json({ projects });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        columns: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isMember =
      project.ownerId === req.user.id ||
      project.members.some((m) => m.userId === req.user.id);

    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    return res.status(200).json({ project });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isAdminMember = project.members.some(
      (m) => m.userId === req.user.id && m.role === 'ADMIN'
    );

    if (project.ownerId !== req.user.id && !isAdminMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { name, description },
    });

    return res.status(200).json({ project: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Solo el dueño puede eliminar el proyecto' });
    }

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function inviteMember(req, res) {
  try {
    const { id: projectId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isAdmin =
      project.ownerId === req.user.id ||
      project.members.some((m) => m.userId === req.user.id && m.role === 'ADMIN');

    if (!isAdmin) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const userToInvite = await prisma.user.findUnique({ where: { email } });

    if (!userToInvite) {
      return res.status(404).json({ message: 'No existe un usuario con ese email' });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToInvite.id, projectId } },
    });

    if (existingMember) {
      return res.status(409).json({ message: 'El usuario ya es miembro del proyecto' });
    }

    const membership = await prisma.projectMember.create({
      data: { userId: userToInvite.id, projectId, role },
    });

    try {
      await sendInvitationEmail({
        toEmail: userToInvite.email,
        toName: userToInvite.name,
        projectName: project.name,
        invitedByName: req.user.name,
      });
    } catch (emailError) {
      console.error('Error enviando correo:', emailError.message);
    }

    await createNotification({
      userId: userToInvite.id,
      type: 'PROJECT_INVITATION',
      message: `${req.user.name} te invitó al proyecto "${project.name}"`,
      projectId: project.id,
    });

    return res.status(201).json({
      message: 'Usuario invitado correctamente',
      member: { id: membership.id, email: userToInvite.email, name: userToInvite.name, role: membership.role },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function removeMember(req, res) {
  try {
    const { id: projectId, memberId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isAdmin =
      project.ownerId === req.user.id ||
      project.members.some((m) => m.userId === req.user.id && m.role === 'ADMIN');

    if (!isAdmin) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    if (memberId === project.ownerId) {
      return res.status(400).json({ message: 'No puedes remover al dueño del proyecto' });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: memberId, projectId } },
    });

    return res.status(200).json({ message: 'Miembro removido correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getMembers(req, res) {
  try {
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }

    const isMember =
      project.ownerId === req.user.id ||
      project.members.some((m) => m.userId === req.user.id);

    if (!isMember) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return res.status(200).json({ members });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
