"use client"
import { buttonVariants } from '@/components/ui/button';
import Link from "next/link"

export default function Home() {
    return (
        <div className="min-h-screen flex justify-center items-center">
            <div className="space-y-4 flex flex-col items-center">
                <h1 className="text-5xl font-medium tracking-tight">Badminton Score Tracker</h1>
                <p className="text-xl text-center text-balance max-w-2xl text-zinc-500">
                    A simple app with great UI to track your badminton matches and scores.
                </p>

                <div className="gap-2 flex">
                    <Link className={`${buttonVariants({ variant: "secondary" })}`} href="/">Learn More</Link>
                    <Link className={`${buttonVariants({ variant: "main" })}`} href="/login">Log in</Link>
                </div>
            </div>
        </div>
    )
}
    