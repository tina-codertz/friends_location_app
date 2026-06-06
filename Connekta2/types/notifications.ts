export type PushNotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'sharing_expired'
  | 'sharing_paused'
  | 'sos'
  | 'place_arrival'
  | 'place_departure';

export type PushNotificationPayload = {
  type?: PushNotificationType;
  route?: string;
  fromUid?: string;
};
