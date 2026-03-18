import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isProjectMember, isProjectAdmin } from '../middleware/project.middleware.js';
import {
  createLabel,
  getLabels,
  deleteLabel,
  addLabelToCard,
  removeLabelFromCard,
} from '../controllers/label.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', isProjectMember, getLabels);
router.post('/', isProjectAdmin, createLabel);

// Specific card-label routes before the wildcard /:labelId to avoid shadowing
router.post('/cards/:cardId/labels', isProjectMember, addLabelToCard);
router.delete('/cards/:cardId/labels/:labelId', isProjectMember, removeLabelFromCard);

router.delete('/:labelId', isProjectAdmin, deleteLabel);

export default router;
