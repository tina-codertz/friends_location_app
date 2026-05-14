import { Hono } from 'hono';
import { jwtAuth } from '../middleware/jwt';
import {
  setLocationSharing,
  pingLocation,
  friendsLocations,
  myLocationState,
} from '../controllers/location.controller';

const location = new Hono();

location.use('*', jwtAuth);
location.post('/sharing', setLocationSharing);
location.post('/ping', pingLocation);
location.get('/friends', friendsLocations);
location.get('/me', myLocationState);

export default location;
