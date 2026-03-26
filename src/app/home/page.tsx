import {Button} from "@/components/ui/button";

const Home = () => {
    return (
        <div className="min-h-screen flex justify-center items-center">
            <div className="space-y-4  flex flex-col items-center ">

            <h1 className="text-5xl font-medium">Badminton Score Tracker</h1>
            <p className="text-xl text-center text-balance max-w-2xl ">
                A simple app with great UI to track your badminton matches and scores.
            </p>
            <div className=" gap-2 flex">
            <Button className="bg-[linear-gradient(to_bottom,rgba(0,136,255,0.7)_0%,rgba(0,136,255,0.7)_18%,rgba(0,136,255,0.75)_36%,rgba(0,136,255,1)_66%,#0077ff_100%)] border-blue-500 shadow-none">Sign Up</Button>
            <Button variant="secondary">Log in</Button>
            </div>
            </div>
        </div>
    );
}

export default Home;