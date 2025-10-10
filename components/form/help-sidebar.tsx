'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail } from 'lucide-react';

export function HelpSidebar() {
  const handleContactExpert = () => {
    window.open('tel:+34952853647', '_self');
  };

  const handleEmailQuote = () => {
    window.open('mailto:info@fluentfinanceabroad.com', '_self');
  };

  return (
    <div className="w-80 bg-gray-50 min-h-screen p-6">
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">You have questions?</CardTitle>
          <p className="text-sm text-muted-foreground">
            We&apos;ll have the answers.
          </p>
          <p className="text-xs font-medium" style={{ color: '#234c8a' }}>
            Clear and Concise Spanish Mortgage Advice
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleContactExpert}
          >
            <Phone className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Contact a Mortgage Expert</div>
              <div className="text-sm text-muted-foreground">+34 952 85 36 47</div>
            </div>
          </Button>

                    <Button 
            variant="outline" 
            className="w-full justify-start gap-3 h-auto py-3 border-ffa-blue/20 hover:bg-ffa-blue/5"
            onClick={handleEmailQuote}
          >
            <Mail className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Email Quote</div>
              <div className="text-sm text-muted-foreground">info@fluentfinanceabroad.com</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* FFA Tagline */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Spanish mortgage specialists since 2006
        </p>
      </div>
    </div>
  );
}