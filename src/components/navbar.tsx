
const Navbar = () => {
    return (
        <div className="bg-background">
            <div className="container max-w-6xl mx-auto px-6">
                <div className="flex items-stretch justify-between">
                    <div className="flex items-center px-2 py-4">
                        <h1 className="text-xl font-bold">Badminton Tracker</h1>
                    </div>
                    <div className="flex items-stretch">
                        <button className="h-full px-6 bg-background text-primary hover:bg-accent hover:text-accent-foreground border-none">
                            Create Match
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Navbar;