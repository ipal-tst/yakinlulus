"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/lib/api";
import { Users as UsersIcon, Mail, Shield } from "lucide-react";

export default function StaffUsersPage() {
    const { data: users, isLoading } = useUsers(1, 50);

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Data</h1>
                    <p className="text-sm text-muted-foreground">View user list</p>
                </div>
                <Badge variant="secondary" className="text-xs">Read-Only</Badge>
            </div>

            <Card className="p-4">
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-12 skeleton" />
                        ))}
                    </div>
                ) : (users as any)?.length > 0 ? (
                    <div className="space-y-1">
                        {(users as any).map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border bg-background text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                        {u.full_name?.charAt(0) || u.email?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{u.full_name || "Unknown"}</p>
                                        <p className="text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {u.email}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> {u.role || "STUDENT"}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <UsersIcon className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No users found.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
