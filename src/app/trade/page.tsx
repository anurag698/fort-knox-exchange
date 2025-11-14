import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";

export default function TradePage() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
            <ArrowRightLeft className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Trading Interface</CardTitle>
          <CardDescription>
            A full-featured trading view with order books, charts, and order forms will be available here. Coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The frontend trading components are under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
