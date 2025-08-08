import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId } = await auth();
  
  // If already signed in, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn 
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}