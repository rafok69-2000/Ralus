import prisma from '../lib/prisma.js';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

const CARD_INCLUDE = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  labels: true,
};

export async function createLabel(req, res) {
  try {
    const { projectId } = req.params;
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ message: 'El nombre y el color son requeridos' });
    }

    if (!HEX_COLOR_RE.test(color)) {
      return res.status(400).json({ message: 'El color debe ser un valor hexadecimal válido (ej. #FF5733)' });
    }

    const label = await prisma.label.create({
      data: { name, color, projectId },
    });

    return res.status(201).json({ label });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function getLabels(req, res) {
  try {
    const { projectId } = req.params;

    const labels = await prisma.label.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ labels });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function deleteLabel(req, res) {
  try {
    const { projectId, labelId } = req.params;

    const label = await prisma.label.findFirst({ where: { id: labelId, projectId } });
    if (!label) {
      return res.status(404).json({ message: 'Etiqueta no encontrada' });
    }

    await prisma.label.delete({ where: { id: labelId } });

    return res.status(200).json({ message: 'Etiqueta eliminada correctamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function addLabelToCard(req, res) {
  try {
    const { projectId, cardId } = req.params;
    const { labelId } = req.body;

    if (!labelId) {
      return res.status(400).json({ message: 'labelId es requerido' });
    }

    const label = await prisma.label.findFirst({ where: { id: labelId, projectId } });
    if (!label) {
      return res.status(404).json({ message: 'Etiqueta no encontrada en este proyecto' });
    }

    const card = await prisma.card.findFirst({
      where: { id: cardId, column: { projectId } },
      include: { labels: { select: { id: true } } },
    });
    if (!card) {
      return res.status(404).json({ message: 'Tarjeta no encontrada' });
    }

    if (card.labels.some((l) => l.id === labelId)) {
      return res.status(409).json({ message: 'La tarjeta ya tiene esta etiqueta' });
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: { labels: { connect: { id: labelId } } },
      include: CARD_INCLUDE,
    });

    return res.status(200).json({ card: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

export async function removeLabelFromCard(req, res) {
  try {
    const { projectId, cardId, labelId } = req.params;

    const card = await prisma.card.findFirst({
      where: { id: cardId, column: { projectId } },
    });
    if (!card) {
      return res.status(404).json({ message: 'Tarjeta no encontrada' });
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: { labels: { disconnect: { id: labelId } } },
      include: CARD_INCLUDE,
    });

    return res.status(200).json({ card: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
