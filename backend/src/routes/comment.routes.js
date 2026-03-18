import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isProjectMember } from '../middleware/project.middleware.js';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/comment.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(isProjectMember);

router.get('/', getComments);
router.post('/', createComment);
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);

export default router;
