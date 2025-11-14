import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { AlertCircle, ShieldCheck } from "lucide-react";

export default function MigrationGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle className="text-destructive"/>When to Use DEV Rules</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            Use the <strong>DEV Rules</strong> exclusively during the early stages of development. Their purpose is to give you maximum freedom to build and iterate on your data model and application logic without fighting permission errors.
          </p>
          <ul>
            <li><strong>Ideal Scenario:</strong> A dedicated, separate Firebase project for development (e.g., <code>fort-knox-dev</code>).</li>
            <li><strong>Key Benefit:</strong> You can read/write directly from the Firebase Console or your client app to quickly seed data and test functionality.</li>
            <li><strong>Warning:</strong> These rules offer zero security. Do not use this project for any real user data, not even for internal testing with non-technical team members.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-green-500"/>When to Switch to PROD Rules</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            Switch to the <strong>PROD Rules</strong> as soon as your data model is stable and you begin developing your trusted backend logic (e.g., Cloud Functions or a server using the Admin SDK).
          </p>
          <ul>
            <li><strong>Trigger Point:</strong> Before you deploy your app to a staging environment, invite external testers, or prepare for launch.</li>
            <li><strong>Ideal Scenario:</strong> Your production Firebase project (e.g., <code>fort-knox-prod</code>) should <em>only</em> ever have PROD rules.</li>
            <li><strong>Effect:</strong> Client-side write capabilities will become highly restricted. This forces you to build your application correctly, where sensitive operations like updating balances or order statuses are handled securely by your backend.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Deploy & Manage Rules</CardTitle>
          <CardDescription>
            Rely on the Firebase CLI for predictable and version-controlled deployments. Avoid editing rules directly in the Firebase Console for your production project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2">1. Set Up Your Project</h3>
            <p className="text-sm text-muted-foreground mb-2">
              In your project root, you should have two files: <code>firestore.rules</code> (for production) and <code>firestore.rules.dev</code> (for development).
              Then, configure your <code>firebase.json</code> file to point to your production rules file.
            </p>
            <CodeBlock>
{`{
  "firestore": {
    "rules": "firestore.rules"
  }
}
`}
            </CodeBlock>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">2. Deploying to Production</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Use the Firebase CLI to deploy the rules specified in <code>firebase.json</code>.
            </p>
            <CodeBlock>
{`# Select your production project first
firebase use fort-knox-prod

# Deploy only the firestore rules
firebase deploy --only firestore:rules`}
            </CodeBlock>
          </div>
           <div>
            <h3 className="font-semibold text-foreground mb-2">3. Using DEV Rules in a Dev Project</h3>
            <p className="text-sm text-muted-foreground mb-2">
              To temporarily deploy your dev rules to a dev project, you can specify the file directly.
            </p>
            <CodeBlock>
{`# Select your development project
firebase use fort-knox-dev

# Deploy the DEV rules file
firebase deploy --only firestore:rules --rules firestore.rules.dev`}
            </CodeBlock>
          </div>
           <div>
            <h3 className="font-semibold text-foreground mb-2">Avoiding Firebase Studio Overwrites</h3>
            <p className="text-sm text-muted-foreground">
              The Firebase Console has a tendency to auto-edit rules. The best practice is to always treat your local <code>firestore.rules</code> file as the source of truth. If the console overwrites your rules, simply redeploy them from your terminal using the CLI. This ensures your security posture is managed by your version-controlled codebase, not manual clicks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
