import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
            <Settings className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4">Settings</CardTitle>
          <CardDescription>
            Manage your profile, security settings (2FA), and API keys here. Coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User profile and security features are currently being implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
