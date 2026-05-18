import { Hono } from 'hono';
import { jwtAuth } from '../middleware/jwt';
import {
  listMyPlaces,
  listCirclePlaces,
  createPlace,
  deletePlace,
} from '../controllers/places.controller';

const places = new Hono();

places.use('*', jwtAuth);
places.get('/mine', listMyPlaces);
places.get('/circle', listCirclePlaces);
places.post('/', createPlace);
places.delete('/:id', deletePlace);

export default places;
