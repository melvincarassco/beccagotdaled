"use client";

import { LoginGateModal } from "@/components/auth/LoginGateModal";
import { ReportIssueModal } from "@/components/common/ReportIssueModal";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoginGateModal />
      <ReportIssueModal />
      {children}
    </>
  );
}
