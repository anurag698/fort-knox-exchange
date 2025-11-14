import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CandlestickChart, ShieldAlert, ArrowRight } from "lucide-react";

// Placeholder data - in a real app, this would be fetched from your backend.
const summaryStats = [
  { title: "Total Users", value: "1,234", icon: Users },
  { title: "Active Markets", value: "5", icon: CandlestickChart },
  { title: "Pending Withdrawals", value: "12", icon: ShieldAlert },
];

const pendingWithdrawals = [
    { id: "WID-5821", user: "user-abc", amount: "1.5 BTC", risk: "High", date: "2024-07-29" },
    { id: "WID-5820", user: "user-def", amount: "0.2 ETH", risk: "Low", date: "2024-07-29" },
    { id: "WID-5819", user: "user-ghi", amount: "10,000 USDT", risk: "Medium", date: "2024-07-28" },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Oversee and manage the Fort Knox Exchange.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Moderation Queue</CardTitle>
          <CardDescription>
            Review withdrawal requests flagged by the AI for manual approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="font-mono text-xs">{withdrawal.id}</TableCell>
                  <TableCell className="font-mono text-xs">{withdrawal.user}</TableCell>
                  <TableCell>{withdrawal.amount}</TableCell>
                  <TableCell>
                    <Badge variant={withdrawal.risk === 'High' ? 'destructive' : withdrawal.risk === 'Medium' ? 'secondary' : 'default'}>
                      {withdrawal.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>{withdrawal.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                        Review <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
