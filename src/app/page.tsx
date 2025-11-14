import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import fs from "fs/promises";
import path from "path";

async function getFileContent(filePath: string) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return await fs.readFile(fullPath, "utf-8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return `Error: Could not load file content for ${filePath}.`;
  }
}

export default async function Home() {
  const backendJson = await getFileContent('docs/backend.json');
  const firestoreRules = await getFileContent('firestore.rules');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Firestore for Your Exchange
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          A complete guide to structuring your Firestore database, with
          development and production rules for a secure and scalable crypto
          exchange.
        </p>
      </div>
      <Tabs defaultValue="data-model" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
          <TabsTrigger value="data-model">Data Model (backend.json)</TabsTrigger>
          <TabsTrigger value="prod-rules">Security Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="data-model" className="mt-6">
           <Card>
            <CardHeader>
              <CardTitle>Data Model Definition</CardTitle>
              <CardDescription>
                This JSON file defines the entities and Firestore collection structure for the application. It serves as the blueprint for the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{backendJson}</CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="prod-rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Production Security Rules</CardTitle>
              <CardDescription>
                These are the live, secure rules for the production environment, enforcing strict data access policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock>{firestoreRules}</CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
