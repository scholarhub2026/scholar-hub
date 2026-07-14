import { Link } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignUpCard from "@/components/signup/singupCard";
import LoginCard from "@/components/signup/loginCard";

const LoginPage = ({ defaultType }: { defaultType: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mentor-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-primary mb-8"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm">SH</span>
            </div>
            Scholar Hub
          </Link>

          <Tabs defaultValue={defaultType} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginCard />
            </TabsContent>

            <TabsContent value="signup">
              <SignUpCard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
