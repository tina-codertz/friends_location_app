import { Hono } from 'hono';
import { jwtAuth } from '../middleware/jwt';
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  listFriends,
  listIncoming,
  removeFriend,
} from '../controllers/friends.controller';
import { getMyInvite, generateInvite, joinWithCode } from '../controllers/invite.controller';

const friends = new Hono();

friends.use('*', jwtAuth);
friends.get('/search', searchUsers);
friends.post('/request', sendFriendRequest);
friends.post('/accept', acceptFriendRequest);
friends.post('/reject', rejectFriendRequest);
friends.get('/', listFriends);
friends.get('', listFriends);
friends.get('/incoming', listIncoming);
friends.get('/invite', getMyInvite);
friends.post('/invite/generate', generateInvite);
friends.post('/invite/join', joinWithCode);
friends.delete('/:id', removeFriend);

export default friends;
