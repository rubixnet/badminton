"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { MatchForm } from '@/components/match-form'
import type { Match } from '@/types/match'

interface CreateMatchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onMatchCreated: (match: Match) => void
}

export function CreateMatchDialog({
    open, 
    onOpenChange,
    onMatchCreated
}: CreateMatchDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Add Match</DialogTitle>
                </DialogHeader>
                <div className="p-6 pt-4">
                    <MatchForm onSubmit={onMatchCreated} onCancel={() => onOpenChange(false)} />
                </div>
            </DialogContent>
        </Dialog>
    )
}