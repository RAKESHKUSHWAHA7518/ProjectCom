import express from 'express';
import { getMySkills, addSkill, deleteSkill, endorseSkill } from '../controllers/skillController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMySkills)
  .post(protect, addSkill);

router.route('/:id')
  .delete(protect, deleteSkill);

router.route('/:id/endorse')
  .post(protect, endorseSkill);

export default router;
