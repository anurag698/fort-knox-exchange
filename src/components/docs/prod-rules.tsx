import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";

const prodRules = `rules_version = '2';

// Production-ready, secure Firestore rules for Fort Knox Exchange.
// Default deny-all, with specific allow rules for collections.
service cloud.firestore {
  match /databases/{database}/documents {

    // --- Helper Functions ---
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      // Assumes a custom claim 'role' is set to 'admin' via Admin SDK.
      // return request.auth.token.role == 'admin';
      return false; // Safest default: deny client-side admin access.
    }

    // --- Collections ---

    // users/{userId}
    match /users/{userId} {
      allow read, update: if isSignedIn() && isOwner(userId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
    }

    // users/{userId}/balances/{assetId}
    match /users/{userId}/balances/{assetId} {
      allow read: if isSignedIn() && isOwner(userId);
      allow write: if false; // Backend only.
    }

    // orders/{orderId}
    match /orders/{orderId} {
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow update, delete: if false; // Backend only (matching engine).
    }

    // markets/{marketId}
    match /markets/{marketId} {
      allow read: if true;
      allow write: if false; // Admin backend only.
    }

    // deposits/{depositId}
    match /deposits/{depositId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow write: if false; // Backend only (blockchain watcher).
    }

    // withdrawals/{withdrawalId}
    match /withdrawals/{withdrawalId} {
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow update: if false; // Backend only (admin approval).
    }

    // adminUsers/{adminId}
    match /adminUsers/{adminId} {
      allow read, write: if false; // Backend only.
    }

    // publicData/{docId}
    match /publicData/{docId} {
      allow read: if true;
      allow write: if false; // Admin backend only.
    }

    // --- Default Deny Rule ---
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

export default function ProdRules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Rules</CardTitle>
        <CardDescription>
          These secure rules enforce strict access control for a live application. They assume most write operations are handled by a trusted backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CodeBlock>{prodRules}</CodeBlock>
      </CardContent>
    </Card>
  );
}
