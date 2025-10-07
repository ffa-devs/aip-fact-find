/**
 * GHL OAuth Setup Page
 * 
 * One-time setup page to connect GoHighLevel account via OAuth
 */

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Zap className="mx-auto h-16 w-16 text-blue-500" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Connect GoHighLevel
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Connect your GoHighLevel account to automatically sync contacts from the AIP form.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong>
            </p>
            <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>You&apos;ll be redirected to GoHighLevel</li>
              <li>Choose a location to connect</li>
              <li>Authorize contact access</li>
              <li>Tokens will be stored securely</li>
            </ul>
          </div>

          <Link href="/api/gohigh/authorize" className="block">
            <Button className="w-full" size="lg">
              Connect to GoHighLevel
            </Button>
          </Link>

          <p className="text-xs text-center text-gray-500">
            This is a one-time setup. Tokens will auto-refresh automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
