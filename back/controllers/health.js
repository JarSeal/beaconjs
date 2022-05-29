import { Router } from 'express';

const router = Router();

router.get('/', async (request, response) => {
  response.send('ok');
});

export default router;
