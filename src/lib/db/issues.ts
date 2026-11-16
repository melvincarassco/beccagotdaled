import { createAdminClient } from "@/lib/supabase/admin";
import { IssueReport } from "@/types";

const localIssues: IssueReport[] = [];

/**
 * Creates a new issue report raised by a guest or visitor
 */
export async function createIssueReport(data: {
  guestName?: string;
  guestContact?: string;
  pageUrl: string;
  componentOrArea: string;
  title: string;
  description: string;
  codeSemantics?: string;
  deviceInfo?: string;
}): Promise<IssueReport> {
  const issue: IssueReport = {
    id: crypto.randomUUID(),
    guestName: data.guestName?.trim() || "Anonymous Guest",
    guestContact: data.guestContact?.trim() || undefined,
    pageUrl: data.pageUrl,
    componentOrArea: data.componentOrArea,
    title: data.title.trim(),
    description: data.description.trim(),
    codeSemantics: data.codeSemantics?.trim() || undefined,
    deviceInfo: data.deviceInfo?.trim() || undefined,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  localIssues.unshift(issue);

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data: inserted, error } = await adminClient
        .from("admins")
        .insert({
          email: `issue:${JSON.stringify(issue)}`,
          role: "moderator",
        })
        .select("id")
        .single();

      if (!error && inserted) {
        issue.dbRowId = inserted.id;
      }
    } catch (err) {
      console.error("Supabase createIssueReport error:", err);
    }
  }

  return issue;
}

/**
 * Retrieves all issues, latest first
 */
export async function getAllIssues(): Promise<IssueReport[]> {
  const issues: IssueReport[] = [...localIssues];

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("admins")
        .select("id, email, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        for (const row of data) {
          if (row.email?.startsWith("issue:")) {
            try {
              const parsed: IssueReport = JSON.parse(row.email.slice(6));
              parsed.dbRowId = row.id;
              const idx = issues.findIndex((i) => i.id === parsed.id);
              if (idx === -1) {
                issues.push(parsed);
              } else {
                issues[idx] = {
                  ...issues[idx],
                  ...parsed,
                  dbRowId: row.id,
                };
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Supabase getAllIssues error:", err);
    }
  }

  // Sort descending by createdAt
  issues.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return issues;
}

/**
 * Updates issue status ("open" | "resolved") and optional admin notes
 */
export async function updateIssueStatus(
  id: string,
  status: "open" | "resolved",
  adminNotes?: string
): Promise<IssueReport | null> {
  const all = await getAllIssues();
  const target = all.find((i) => i.id === id);

  if (!target) return null;

  target.status = status;
  target.resolvedAt = status === "resolved" ? new Date().toISOString() : undefined;
  if (adminNotes !== undefined) {
    target.adminNotes = adminNotes;
  }

  // Update local
  const localIdx = localIssues.findIndex((i) => i.id === id);
  if (localIdx !== -1) {
    localIssues[localIdx] = { ...target };
  } else {
    localIssues.unshift({ ...target });
  }

  const adminClient = createAdminClient();
  if (adminClient && target.dbRowId) {
    try {
      const json = JSON.stringify({
        id: target.id,
        guestName: target.guestName,
        guestContact: target.guestContact,
        pageUrl: target.pageUrl,
        componentOrArea: target.componentOrArea,
        title: target.title,
        description: target.description,
        codeSemantics: target.codeSemantics,
        deviceInfo: target.deviceInfo,
        status: target.status,
        createdAt: target.createdAt,
        resolvedAt: target.resolvedAt,
        adminNotes: target.adminNotes,
      });

      await adminClient
        .from("admins")
        .update({ email: `issue:${json}` })
        .eq("id", target.dbRowId);
    } catch (err) {
      console.error("Supabase updateIssueStatus error:", err);
    }
  }

  return target;
}
