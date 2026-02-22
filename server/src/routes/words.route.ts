import { Router } from 'express';
import { getWords, getLanguages } from '../controllers/words.controller.js';

const router = Router();

router.get('/languages', getLanguages);
router.get('/', getWords);

export default router;
