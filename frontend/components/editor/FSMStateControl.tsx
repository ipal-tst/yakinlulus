"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Send,
    CheckCircle2,
    XCircle,
    Archive,
    Clock,
    ShieldAlert,
} from "lucide-react";

export type FSMState = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";

interface FSMStateControlProps {
    currentState: FSMState;
    onStateChange: (newState: FSMState, reason?: string) => void;
    userRole?: "teacher" | "reviewer" | "admin";
}

export function FSMStateControl({
    currentState,
    onStateChange,
    userRole = "teacher",
}: FSMStateControlProps) {
    const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState("");

    const handleRejectSubmit = () => {
        onStateChange("REJECTED", rejectionReason);
        setIsRejectDialogOpen(false);
        setRejectionReason("");
    };

    const getBadgeVariant = (state: FSMState) => {
        switch (state) {
            case "PUBLISHED":
            case "APPROVED":
                return "success";
            case "IN_REVIEW":
                return "warning";
            case "REJECTED":
                return "destructive";
            default:
                return "secondary";
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs">
            <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground">Status Workflow FSM:</div>
                <Badge variant={getBadgeVariant(currentState)} className="text-xs font-bold px-3 py-1">
                    {currentState === "IN_REVIEW" && <Clock className="mr-1 h-3.5 w-3.5" />}
                    {currentState === "APPROVED" && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                    {currentState === "REJECTED" && <XCircle className="mr-1 h-3.5 w-3.5" />}
                    {currentState}
                </Badge>
            </div>

            {/* Action Buttons based on FSM State */}
            <div className="flex flex-wrap items-center gap-2">
                {currentState === "DRAFT" && (
                    <Button
                        size="sm"
                        onClick={() => onStateChange("IN_REVIEW")}
                        className="text-xs"
                    >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Ajukan ke Reviewer
                    </Button>
                )}

                {currentState === "IN_REVIEW" && (
                    <>
                        <Button
                            size="sm"
                            variant="success"
                            onClick={() => onStateChange("APPROVED")}
                            className="text-xs"
                        >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve Soal
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setIsRejectDialogOpen(true)}
                            className="text-xs"
                        >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject / Perbaikan
                        </Button>
                    </>
                )}

                {currentState === "APPROVED" && (
                    <Button
                        size="sm"
                        variant="default"
                        onClick={() => onStateChange("PUBLISHED")}
                        className="text-xs bg-primary"
                    >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Publikasi ke Paket Ujian
                    </Button>
                )}

                {currentState === "REJECTED" && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStateChange("DRAFT")}
                        className="text-xs"
                    >
                        Revisi & Kembalikan ke Draft
                    </Button>
                )}
            </div>

            {/* Rejection Dialog Modal */}
            <Dialog
                isOpen={isRejectDialogOpen}
                onClose={() => setIsRejectDialogOpen(false)}
                title="Alasan Penolakan / Catatan Perbaikan Soal"
                description="Berikan catatan spesifik mengapa soal ini memerlukan perbaikan oleh penulis."
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Contoh: Opsi C dan D memiliki rumus aljabar yang sama (duplikat)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRejectSubmit}
                            disabled={!rejectionReason.trim()}
                        >
                            Kirim Catatan Penolakan
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
