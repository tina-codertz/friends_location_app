import { Hono } from 'hono';
import { jwtAuth } from '../middleware/jwt';
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  listFriends,
  listIncoming,
} from '../controllers/friends.controller';

const friends = new Hono();

friends.use('*', jwtAuth);
friends.get('/search', searchUsers);
friends.post('/request', sendFriendRequest);
friends.post('/accept', acceptFriendRequest);
friends.post('/reject', rejectFriendRequest);
friends.get('/', listFriends);
friends.get('/incoming', listIncoming);

export default friends;
