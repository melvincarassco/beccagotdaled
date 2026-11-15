"use client";

import { LoginGateModal } from "@/components/auth/LoginGateModal";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoginGateModal />
      {children}
    </>
  );
}
