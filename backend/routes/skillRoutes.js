import express from 'express';
import { getMySkills, addSkill, deleteSkill } from '../controllers/skillController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMySkills)
  .post(protect, addSkill);

router.route('/:id')
  .delete(protect, deleteSkill);

export default router;
