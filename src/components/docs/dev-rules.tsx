import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

const devRules = `// DEV ONLY – DO NOT USE IN PRODUCTION
// These rules are intentionally permissive to allow for rapid development
// and testing without being blocked by security permissions.
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`;

export default function DevRules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Development Rules</CardTitle>
        <CardDescription>
          Use these permissive rules in your dedicated development environment to avoid permission errors while building.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Warning: Insecure</AlertTitle>
          <AlertDescription>
            These rules allow anyone to read, write, and delete any data in your Firestore database.
            Never use them in a production environment or with sensitive data.
          </AlertDescription>
        </Alert>
        <CodeBlock>{devRules}</CodeBlock>
      </CardContent>
    </Card>
  );
}
