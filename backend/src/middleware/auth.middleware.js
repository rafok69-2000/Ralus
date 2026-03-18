import prisma from '../lib/prisma.js';
import { verifyToken } from '../utils/token.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }

  req.user = user;
  next();
}
