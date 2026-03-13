import { Router } from 'express';
import {
  createColumn,
  getColumns,
  updateColumn,
  reorderColumns,
  deleteColumn,
} from '../controllers/column.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', createColumn);
router.get('/', getColumns);
router.put('/reorder', reorderColumns);
router.put('/:columnId', updateColumn);
router.delete('/:columnId', deleteColumn);

export default router;
