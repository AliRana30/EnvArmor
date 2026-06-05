'use client';

import { useState } from 'react';
import { Check, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const planInfo = {
  FREE: { name: 'Free Forever', price: '$0/month', features: ['1 project', 'Basic scanning', 'Pre-commit hooks', '100 API requests/min'] },
  BASIC: { name: 'Basic', price: '$3/month', features: ['5 projects', 'Secret vault', 'Team collaboration', '1000 API requests/min'] },
  PRO: { name: 'Professional', price: '$9/month', features: ['Unlimited projects', 'Advanced analytics', 'Secret versioning', 'Unlimited requests'] },
  TEAM: { name: 'Team', price: '$19/month', features: ['Everything in Pro', 'Advanced permissions', 'Team management', 'Priority support'] }
} as const;


interface SettingsFormProps {
  initialUser: {
    emailOnDetection: boolean;
    emailWeeklyDigest: boolean;
    emailRotationReminder: boolean;
    slackWebhookUrl: string | null;
    plan: string;
  };
}

export function SettingsForm({ initialUser }: SettingsFormProps) {
  const router = useRouter();
  const [emailOnDetection, setEmailOnDetection] = useState(initialUser.emailOnDetection);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(initialUser.emailWeeklyDigest);
  const [emailRotationReminder, setEmailRotationReminder] = useState(initialUser.emailRotationReminder);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(initialUser.slackWebhookUrl || '');
  const [plan, setPlan] = useState(initialUser.plan);
  const [saving, setSaving] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOnDetection,
          emailWeeklyDigest,
          emailRotationReminder,
          slackWebhookUrl,
          plan
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings updated successfully!');
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSavePreferences} className="space-y-8">
      {/* Notification Preferences */}
      <section className="border-8 border-black bg-white p-6 shadow-neo-lg">
        <h2 className="text-2xl font-black text-black uppercase tracking-tight">Notification Preferences</h2>
        <p className="mt-1 text-sm font-bold text-gray-600">Configure how you receive leak alerts and status digests.</p>

        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={emailOnDetection}
              onChange={(e) => setEmailOnDetection(e.target.checked)}
              className="peer sr-only"
            />
            <div className="flex h-6 w-6 items-center justify-center border-4 border-black bg-white transition-all peer-checked:bg-neo-secondary">
              {emailOnDetection && <Check className="h-4 w-4 stroke-[4px] text-black" />}
            </div>
            <div>
              <p className="font-black text-black uppercase text-sm">Email on detection</p>
              <p className="text-xs font-bold text-gray-500">Get notified immediately when a secret is committed or leaked.</p>
            </div>
          </label>

          <label className="flex items-center gap-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={emailWeeklyDigest}
              onChange={(e) => setEmailWeeklyDigest(e.target.checked)}
              className="peer sr-only"
            />
            <div className="flex h-6 w-6 items-center justify-center border-4 border-black bg-white transition-all peer-checked:bg-neo-secondary">
              {emailWeeklyDigest && <Check className="h-4 w-4 stroke-[4px] text-black" />}
            </div>
            <div>
              <p className="font-black text-black uppercase text-sm">Weekly digest</p>
              <p className="text-xs font-bold text-gray-500">Receive a summary of scanned codebases and potential issues once a week.</p>
            </div>
          </label>

          <label className="flex items-center gap-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={emailRotationReminder}
              onChange={(e) => setEmailRotationReminder(e.target.checked)}
              className="peer sr-only"
            />
            <div className="flex h-6 w-6 items-center justify-center border-4 border-black bg-white transition-all peer-checked:bg-neo-secondary">
              {emailRotationReminder && <Check className="h-4 w-4 stroke-[4px] text-black" />}
            </div>
            <div>
              <p className="font-black text-black uppercase text-sm">Rotation reminder</p>
              <p className="text-xs font-bold text-gray-500">Get reminders when live API keys and credentials are older than 90 days.</p>
            </div>
          </label>

          <div className="border-t-4 border-black/10 pt-4">
            <label className="block font-black text-black uppercase text-sm">Slack Webhook URL</label>
            <p className="text-xs font-bold text-gray-500 mb-2">Send real-time alerts directly to your Slack channel.</p>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhookUrl}
              onChange={(e) => setSlackWebhookUrl(e.target.value)}
              className="w-full border-4 border-black bg-white p-3 font-bold text-black outline-none transition-all placeholder:text-gray-400 focus:bg-neo-bg shadow-neo-sm focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none"
            />
          </div>
        </div>
      </section>



      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 border-4 border-black bg-neo-accent px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo-md active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 text-white" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}
