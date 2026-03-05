import { CreateMatchDialog } from "@/components/ui/create-match-dialog";
import { useState } from "react";
import type { Match } from "@/types/match";
import { Button } from "./ui/button";

interface NavbarProps {
    onMatchCreated: (match: Match) => void;
}

const Navbar = ({ onMatchCreated }: NavbarProps) => {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    return (
        <>
            <div className="bg-background">
                <div className="container max-w-6xl mx-auto px-6">
                    <div className="flex items-stretch justify-between">
                        <div className="flex items-center px-2 py-4">
                            <h1 className="text-xl font-bold">Badminton Tracker</h1>
                        </div>
                        <div className="flex items-stretch">
                            <Button
                                onClick={() => setIsCreateDialogOpen(true)}
                                className="py-4 px-6 mt-2"
                            >
                                Create Match
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <CreateMatchDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onMatchCreated={(match) => {
                    onMatchCreated(match);
                    setIsCreateDialogOpen(false);
                }}
            />
        </>
    );
};

export default Navbar;