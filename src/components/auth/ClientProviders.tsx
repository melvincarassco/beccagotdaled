"use client";

import { LoginGateModal } from "@/components/auth/LoginGateModal";
import { ReportIssueModal } from "@/components/common/ReportIssueModal";
import { LoginTroubleNotice } from "@/components/common/LoginTroubleNotice";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoginGateModal />
      <ReportIssueModal />
      <LoginTroubleNotice />
      {children}
    </>
  );
}
