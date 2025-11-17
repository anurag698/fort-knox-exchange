
'use client';

import { useEffect, useState } from "react";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, where } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Trash2, BellRing, Loader2 } from "lucide-react";
import type { PriceAlert } from "@/lib/types";

const alertSchema = z.object({
  condition: z.enum(["above", "below"]),
  price: z.coerce.number().positive("Price must be positive."),
});

type AlertFormValues = z.infer<typeof alertSchema>;

export function AlertsManager({ marketId }: { marketId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      condition: "above",
    },
  });

  useEffect(() => {
    if (!user || !firestore) {
      setIsLoading(false);
      return;
    }
    const q = query(collection(firestore, "users", user.uid, "alerts"), where("marketId", "==", marketId));
    const unsub = onSnapshot(q, (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert)));
      setIsLoading(false);
    });
    return () => unsub();
  }, [user, firestore, marketId]);

  const createAlert = async (values: AlertFormValues) => {
    if (!user || !firestore) return;
    await addDoc(collection(firestore, "users", user.uid, "alerts"), {
      marketId,
      condition: values.condition,
      price: values.price,
      enabled: true,
      createdAt: serverTimestamp(),
      lastTriggeredAt: null,
    });
    form.reset();
  };
  
  const toggleAlert = async (id: string, enabled: boolean) => {
    if (!user || !firestore) return;
    await updateDoc(doc(firestore, "users", user.uid, "alerts", id), { enabled: !enabled });
  };

  const removeAlert = async (id: string) => {
    if (!user || !firestore) return;
    await deleteDoc(doc(firestore, "users", user.uid, "alerts", id));
  };
  
  if (!user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Price Alerts</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
                Please sign in to manage alerts.
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Price Alerts
        </CardTitle>
        <CardDescription>Get notified when the market price reaches your target.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createAlert)} className="flex items-end gap-2 mb-4">
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                       <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="Enter target price" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set Alert
            </Button>
          </form>
        </Form>
        <div className="h-48 overflow-y-auto border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Condition</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                 <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={3} className="text-center">Loading alerts...</TableCell></TableRow>
                    ) : alerts.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No alerts for this market.</TableCell></TableRow>
                    ) : (
                        alerts.map((alert) => (
                        <TableRow key={alert.id}>
                            <TableCell>
                                <span className="capitalize">{alert.condition}</span> {alert.price}
                            </TableCell>
                            <TableCell>
                                <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id, alert.enabled)} />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeAlert(alert.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
