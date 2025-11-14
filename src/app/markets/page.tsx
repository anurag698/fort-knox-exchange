import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CandlestickChart } from "lucide-react";

export default function MarketsPage() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
            <CandlestickChart className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Markets Page</CardTitle>
          <CardDescription>
            This section will display real-time market data, charts, and trading pairs. Coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The backend infrastructure for markets, orders, and the matching engine is being built.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
