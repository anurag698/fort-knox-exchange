import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
            <UserCog className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Admin Panel</CardTitle>
          <CardDescription>
            This section is for exchange administrators to manage users, markets, and withdrawals. Coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Administrative controls and dashboards are under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
