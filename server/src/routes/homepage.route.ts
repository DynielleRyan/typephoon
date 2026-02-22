import { Router } from 'express';
import { getHomePage } from '../controllers/homepage.controller.js';

const router  = Router();

router.get('/homepage', getHomePage);

export default router;
