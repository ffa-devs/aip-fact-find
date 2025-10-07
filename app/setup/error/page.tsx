/**
 * OAuth Setup Error Page
 * 
 * Displays error message if GHL OAuth flow fails
 */

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function SetupErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const errorMessage = message || 'An unknown error occurred';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Setup Failed
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            There was a problem connecting to GoHighLevel.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800 font-medium">Error Details:</p>
            <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          </div>

          <Link href="/api/gohigh/authorize" className="block">
            <Button className="w-full" variant="outline">
              Try Again
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button className="w-full" variant="ghost">
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
