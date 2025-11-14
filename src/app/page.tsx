import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataModel from "@/components/docs/data-model";
import DevRules from "@/components/docs/dev-rules";
import ProdRules from "@/components/docs/prod-rules";
import MigrationGuide from "@/components/docs/migration-guide";

export default function Home() {
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
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="data-model">Data Model</TabsTrigger>
          <TabsTrigger value="dev-rules">DEV Rules</TabsTrigger>
          <TabsTrigger value="prod-rules">PROD Rules</TabsTrigger>
          <TabsTrigger value="migration-guide">Migration Guide</TabsTrigger>
        </TabsList>
        <TabsContent value="data-model" className="mt-6">
          <DataModel />
        </TabsContent>
        <TabsContent value="dev-rules" className="mt-6">
          <DevRules />
        </TabsContent>
        <TabsContent value="prod-rules" className="mt-6">
          <ProdRules />
        </TabsContent>
        <TabsContent value="migration-guide" className="mt-6">
          <MigrationGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}
