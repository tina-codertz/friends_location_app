# Firebase (Connekta)

Client SDK and Firestore deploy artifacts for the mobile app.

Import as `@/connekta-firebase` (not `@/firebase` — that path collides with the npm `firebase` package in Metro).

```
connekta-firebase/
  config.ts          # App init — auth + Firestore
  auth-service.ts    # Email auth, profiles, session helpers
  ids.ts             # Document ID helpers
  types.ts           # Firestore document shapes
  index.ts           # Barrel exports
  firestore/
    friends.ts       # Token guard, circle members
    places.ts        # Saved places
    location.ts      # Live location sharing
    circle.ts        # Invites, friend requests
    emergency.ts     # Emergency contacts
  rules/
    firestore.rules
    firestore.indexes.json
```

Publish rules: Firebase Console → Firestore → Rules → paste `rules/firestore.rules`.

App code outside this folder: `services/api.ts` (API facade), `services/biometric-unlock.ts`, `services/session-activity.ts`.
