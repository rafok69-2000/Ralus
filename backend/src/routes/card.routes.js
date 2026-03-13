import { Router } from 'express';
import {
  createCard,
  getCards,
  updateCard,
  moveCard,
  reorderCards,
  deleteCard,
} from '../controllers/card.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', createCard);
router.get('/', getCards);
router.put('/reorder', reorderCards);
router.put('/:cardId/move', moveCard);
router.put('/:cardId', updateCard);
router.delete('/:cardId', deleteCard);

export default router;
