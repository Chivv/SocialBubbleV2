import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/signup/creator',
  '/api/webhook',
  '/api/debug-role',
]);

const isOnboardingRoute = createRouteMatcher([
  '/onboarding',
  '/signup/creator',
  '/signup/client',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  
  // For public routes, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // If not authenticated, redirect to sign-in
  if (!userId) {
    return redirectToSignIn();
  }
  
  // For authenticated users, allow access to all routes
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};