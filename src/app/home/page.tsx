import { withAuth } from "@workos-inc/authkit-nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link"

export default async function Home() {
    const { user } = await withAuth()

    return (
        <div className="min-h-screen flex justify-center items-center">
            <div className="space-y-4 flex flex-col items-center">
                <h1 className="text-5xl font-medium tracking-tight">Badminton Score Tracker</h1>
                <p className="text-xl text-center text-balance max-w-2xl text-zinc-500">
                    A simple app with great UI to track your badminton matches and scores.
                </p>
                
                <div className="gap-2 flex">
                    {user ? (
                        <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl shadow-lg shadow-blue-100 transition-all">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="main">
                                <Link href="/api/auth/signup">Sign Up</Link>
                            </Button>
                            <Button  variant="secondary">
                                <Link href="/api/auth/login">Log in</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
