import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import columnRoutes from './routes/column.routes.js';
import cardRoutes from './routes/card.routes.js';
import labelRoutes from './routes/label.routes.js';
import commentRoutes from './routes/comment.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/columns', columnRoutes);
app.use('/api/projects/:projectId/columns/:columnId/cards', cardRoutes);
app.use('/api/projects/:projectId/labels', labelRoutes);
app.use('/api/projects/:projectId/columns/:columnId/cards/:cardId/comments', commentRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'API Kanban funcionando' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});