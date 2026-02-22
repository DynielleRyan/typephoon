import { Router } from 'express';
import { getHomePage } from '../controllers/homepage.controller';

const router  = Router();

router.get('/homepage',getHomePage);

export default router;
