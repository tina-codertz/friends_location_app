export function friendshipDocId(uidA: string, uidB: string): string {
    return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
  }