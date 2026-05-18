import { Hono } from 'hono';
import { jwtAuth } from '../middleware/jwt';
import { listEmergency, addEmergency, deleteEmergency } from '../controllers/emergency.controller';

const emergency = new Hono();

emergency.use('*', jwtAuth);
emergency.get('/', listEmergency);
emergency.get('', listEmergency);
emergency.post('/', addEmergency);
emergency.post('', addEmergency);
emergency.delete('/:id', deleteEmergency);

export default emergency;
