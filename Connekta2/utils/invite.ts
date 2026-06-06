import * as Linking from 'expo-linking';

/** Build shareable invite link with circle code */
export function buildCircleInviteLink(code: string): string {
  return Linking.createURL('/friends', {
    scheme: 'connekta',
    queryParams: { invite: code.toUpperCase() },
  });
}

export function formatInviteMessage(code: string, username: string): string {
  const link = buildCircleInviteLink(code);
  return (
    `${username} invited you to their Connekta circle.\n\n` +
    `Invite code: ${code.toUpperCase()}\n` +
    `Open the app → My Circle → enter the code, or tap:\n${link}`
  );
}
