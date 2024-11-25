import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess("Successfully logged in!");
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email address
        </Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          required 
          className="h-12 px-4 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-colors"
          placeholder="Enter your email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          required 
          className="h-12 px-4 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-colors"
          placeholder="Enter your password"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full h-12 bg-gray-900 hover:bg-gray-800 transition-colors"
        disabled={isPending}
      >
        {isPending ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Logging in...</span>
          </div>
        ) : (
          'Log in'
        )}
      </Button>
      {error && (
        <Alert variant="destructive" className="mt-4 bg-red-50 text-red-600 border border-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="mt-4 bg-green-50 text-green-600 border border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}