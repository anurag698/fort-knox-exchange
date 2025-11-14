import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Archive, Landmark, ShoppingCart, ArrowDownToLine, ArrowUpFromLine, UserCog, Megaphone } from "lucide-react";

const collections = [
  {
    name: "users/{userId}",
    icon: Users,
    description: "Stores essential user information, including profile data and KYC status.",
    fields: [
      { name: "email", type: "string", desc: "User's unique email address." },
      { name: "username", type: "string", desc: "Publicly visible username." },
      { name: "kycStatus", type: "string", desc: "Enum: PENDING, VERIFIED, REJECTED." },
      { name: "createdAt", type: "timestamp", desc: "Account creation date." },
    ],
  },
  {
    name: "users/{userId}/balances/{assetId}",
    icon: Archive,
    description: "A subcollection holding the user's balance for each crypto asset (e.g., BTC, ETH).",
    fields: [
      { name: "available", type: "number", desc: "Funds usable for new orders." },
      { name: "locked", type: "number", desc: "Funds held in open orders." },
      { name: "assetId", type: "string", desc: "e.g. 'BTC', 'ETH'" },
    ],
  },
  {
    name: "orders/{orderId}",
    icon: ShoppingCart,
    description: "Contains all spot orders placed by users.",
    fields: [
      { name: "userId", type: "string", desc: "ID of the user who placed the order." },
      { name: "marketId", type: "string", desc: "e.g., 'BTC-USDT'." },
      { name: "side", type: "string", desc: "Enum: 'BUY' or 'SELL'." },
      { name: "type", type: "string", desc: "Enum: 'LIMIT' or 'MARKET'." },
      { name: "price", type: "number", desc: "Price for LIMIT orders." },
      { name: "amount", type: "number", desc: "Total order quantity." },
      { name: "status", type: "string", desc: "Enum: OPEN, PARTIAL, FILLED, CANCELED." },
      { name: "createdAt", type: "timestamp", desc: "When the order was placed." },
    ],
  },
  {
    name: "markets/{marketId}",
    icon: Landmark,
    description: "Public configuration for each trading pair.",
    fields: [
      { name: "baseAsset", type: "string", desc: "e.g., 'BTC'." },
      { name: "quoteAsset", type: "string", desc: "e.g., 'USDT'." },
      { name: "minOrderSize", type: "number", desc: "Minimum trade amount." },
      { name: "pricePrecision", type: "integer", desc: "Decimal places for price." },
      { name: "quantityPrecision", type: "integer", desc: "Decimal places for quantity." },
    ],
  },
  {
    name: "deposits/{depositId}",
    icon: ArrowDownToLine,
    description: "Records of funds deposited by users.",
    fields: [
      { name: "userId", type: "string", desc: "The recipient user." },
      { name: "assetId", type: "string", desc: "Deposited asset (e.g., 'BTC')." },
      { name: "amount", type: "number", desc: "Amount deposited." },
      { name: "status", type: "string", desc: "Enum: CONFIRMING, COMPLETED." },
      { name: "txHash", type: "string", desc: "Blockchain transaction hash." },
      { name: "createdAt", type: "timestamp", desc: "Record creation time." },
    ],
  },
  {
    name: "withdrawals/{withdrawalId}",
    icon: ArrowUpFromLine,
    description: "Records of user withdrawal requests.",
    fields: [
      { name: "userId", type: "string", desc: "Requesting user." },
      { name: "assetId", type: "string", desc: "Asset to withdraw." },
      { name: "amount", type: "number", desc: "Amount to withdraw." },
      { name: "status", type: "string", desc: "Enum: REQUESTED, APPROVED, SENT, REJECTED." },
      { name: "toAddress", type: "string", desc: "Destination wallet address." },
      { name: "createdAt", type: "timestamp", desc: "Request time." },
    ],
  },
  {
    name: "adminUsers/{adminId}",
    icon: UserCog,
    description: "Private collection for administrative user roles and permissions. NOT client-accessible.",
    fields: [
      { name: "role", type: "string", desc: "e.g., 'superadmin', 'support'." },
      { name: "permissions", type: "array", desc: "List of specific permissions." },
    ],
  },
  {
    name: "publicData/{docId}",
    icon: Megaphone,
    description: "Publicly readable information, such as system announcements.",
    fields: [
      { name: "title", type: "string", desc: "Announcement title." },
      { name: "content", type: "string", desc: "HTML or Markdown content." },
      { name: "publishedAt", type: "timestamp", desc: "Publication time." },
    ],
  },
];

export default function DataModel() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {collections.map((collection) => (
        <Card key={collection.name}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <collection.icon className="h-6 w-6 text-primary" />
              <code className="text-lg">{collection.name}</code>
            </CardTitle>
            <CardDescription>{collection.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collection.fields.map((field) => (
                  <TableRow key={field.name}>
                    <TableCell className="font-mono">{field.name}</TableCell>
                    <TableCell><Badge variant="secondary">{field.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{field.desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
