import express from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = express.Router();

// GET /api/health — no auth, no rate limiting
router.get('/', getHealth);

export default router;
