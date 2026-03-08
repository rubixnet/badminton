import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  onCreateMatch?: () => void;
}

export function Navbar({
  title,
  onCreateMatch,
}: HeaderProps) {

  // const { theme, setTheme } = useTheme();
  // const cycleTheme = () => {
  //   if (theme === "light") {
  //     setTheme("dark");
  //   } else if (theme === "dark") {
  //     setTheme("system");
  //   } else {
  //     setTheme("light");
  //   }
  // };

  return (
    <>
      <div
        className="md:container md:max-w-6xl md:mx-auto md:px-6"
      >
        <div className=" relative z-50">
          <div className="flex items-stretch justify-between">
            <div className="flex items-center px-2 md:px-0 py-4 cursor-pointer bg-transparent border-none">
              <h1 className="text-xl md:text-3xl select-none font-bold">
                {title}
              </h1>
            </div>
            {/* // added theme change, commenting it for now */}
            <div className="flex items-stretch">
              {/* {showThemeToggle && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-full w-16 md:w-24 bg-background text-primary hover:bg-accent hover:text-accent-foreground border-none rounded-none"
                  onClick={cycleTheme}
                >
                  {mounted && (
                    <>
                      {theme === "light" ? (
                        <Sun className="h-5 w-5" />
                      ) : theme === "dark" ? (
                        <Moon className="h-5 w-5" />
                      ) : (
                        <Monitor className="h-5 w-5" />
                      )}
                    </>
                  )}
                </Button>
              )} */}
              <Button
                size="lg"
                className="mt-2 scale-90"
                onClick={onCreateMatch}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Match
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
