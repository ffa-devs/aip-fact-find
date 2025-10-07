/**
 * OAuth Setup Success Page
 * 
 * Displays success message after completing GHL OAuth flow
 */

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function SetupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const { locationId } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Setup Complete!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Your GoHighLevel account has been successfully connected.
          </p>
          {locationId && (
            <p className="mt-4 text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
              Location ID: {locationId}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              ✅ OAuth tokens stored securely
              <br />
              ✅ Auto-refresh enabled
              <br />
              ✅ Ready to sync contacts
            </p>
          </div>

          <Link href="/" className="block">
            <Button className="w-full">
              Go to Application
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
