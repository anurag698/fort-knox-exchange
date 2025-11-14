
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, Users, ArrowLeft } from "lucide-react";
import { useUsers } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { data: users, isLoading, error } = useUsers();

  const getKYCBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderUsers = () => {
    if (isLoading) {
      return (
        <>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </>
      );
    }

    if (error) {
       return (
        <TableRow>
            <TableCell colSpan={5}>
                 <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Users</AlertTitle>
                    <AlertDescription>
                        Could not fetch user data. Please check your Firestore security rules and network connection.
                    </AlertDescription>
                </Alert>
            </TableCell>
        </TableRow>
      );
    }

    if (!users || users.length === 0) {
      return (
         <TableRow>
            <TableCell colSpan={5} className="text-center py-12">
                 <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-10 w-10 mb-4" />
                    <h3 className="text-lg font-semibold">No Users Found</h3>
                    <p className="text-sm">There are no registered users in the system yet.</p>
                </div>
            </TableCell>
        </TableRow>
      );
    }

    return users.map((user) => {
        const creationDate = user.createdAt?.toDate ? user.createdAt.toDate() : new Date();

        return (
            <TableRow key={user.id}>
                <TableCell className="font-mono text-xs">{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                    <Badge variant={getKYCBadgeVariant(user.kycStatus)}>
                        {user.kycStatus}
                    </Badge>
                </TableCell>
                <TableCell>{creationDate.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/users/${user.id}`}>
                    Manage <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                </TableCell>
            </TableRow>
        )
    });
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Admin</span>
            </Link>
        </Button>
        <div className="flex flex-col gap-1">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
            User Management
            </h1>
            <p className="text-muted-foreground">
            View and manage all registered users.
            </p>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users on the Fort Knox Exchange.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderUsers()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
