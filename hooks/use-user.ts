"use client";

import { useEffect, useState } from "react";

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "FREE" | "BASIC" | "PRO" | "TEAM";
  emailOnDetection: boolean;
  emailWeeklyDigest: boolean;
  emailRotationReminder: boolean;
  slackWebhookUrl: string | null;
};

type UseUserState = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
};

export function useUser(): UseUserState {
  const [state, setState] = useState<UseUserState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    fetch("/api/me")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to fetch current user");
        }
        return response.json();
      })
      .then((payload: { user: CurrentUser | null }) => {
        if (!mounted) {
          return;
        }
        setState({ user: payload.user, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!mounted) {
          return;
        }
        setState({ user: null, loading: false, error: error.message });
      });

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}