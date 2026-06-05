'use client';

import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, HelpCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const plans = [
  {
    name: 'Free',
    slug: 'FREE',
    price: '$0',
    period: '/forever',
    description: 'For indie developers',
    features: [
      '1 project',
      'Basic scanning',
      'Pre-commit hooks',
      '100 API requests/min',
      '.env protection',
      'GitHub OAuth',
    ],
    cta: 'Get Started',
    highlighted: false,
    color: 'bg-neo-muted'
  },
  {
    name: 'Basic',
    slug: 'BASIC',
    price: '$3',
    period: '/month',
    description: 'For small teams',
    features: [
      '5 projects',
      'Secret vault',
      'Team collaboration',
      '1000 API requests/min',
      'Secret versioning',
      'Access control',
      'Custom integrations',
    ],
    cta: 'Coming Soon',
    highlighted: true,
    color: 'bg-neo-secondary'
  },
  {
    name: 'Professional',
    slug: 'PRO',
    price: '$9',
    period: '/month',
    description: 'For growing companies',
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Audit logs',
      'Unlimited API requests',
      'Role-based access',
      'Enterprise SSO',
      'Compliance reports',
    ],
    cta: 'Coming Soon',
    highlighted: false,
    color: 'bg-neo-accent'
  },
  {
    name: 'Team',
    slug: 'TEAM',
    price: '$19',
    period: '/month',
    description: 'For enterprises',
    features: [
      'Everything in Pro',
      'Advanced permissions',
      'Team management',
      'Priority support',
      'Custom contracts',
      'Dedicated account',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
    color: 'bg-white'
  },
];

export default function PricingPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-neo-bg bg-halftone flex flex-col items-center justify-center p-4">
      <div className="border-8 border-black bg-[#064e3b] p-12 shadow-neo-xl -rotate-2 max-w-2xl text-center text-white">
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-4">Coming Soon</h1>
        <p className="text-xl font-bold mb-8">We're redesigning our pricing to be even more developer-friendly.</p>
        <Link 
          href="/"
          className="inline-flex border-4 border-black bg-neo-secondary px-8 py-4 font-black uppercase tracking-widest shadow-neo-sm hover:shadow-neo-md transition-all"
        >
          Back to Home
        </Link>
      </div>
      {/* Redesigned content commented out for now
      <div className="hidden">
        ...
      </div>
      */}
    </div>
  );
}

/* Redesigned Component Code (Commented Out)
export function RedesignedPricing() {
  ...
}
*/
