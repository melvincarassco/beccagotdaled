import { createAdminClient } from "@/lib/supabase/admin";
import { AccessRequest } from "@/types";

const localRequests: AccessRequest[] = [];

/**
 * Creates a new guest access request
 */
export async function createAccessRequest(data: {
  firstName: string;
  lastName: string;
  contact?: string;
  note?: string;
}): Promise<AccessRequest> {
  const request: AccessRequest = {
    id: crypto.randomUUID(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    contact: data.contact?.trim() || undefined,
    note: data.note?.trim() || undefined,
    status: "pending",
    timestamp: new Date().toISOString(),
  };

  localRequests.unshift(request);

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data: inserted, error } = await adminClient
        .from("admins")
        .insert({
          email: `request:${JSON.stringify(request)}`,
          role: "moderator",
        })
        .select("id")
        .single();

      if (!error && inserted) {
        request.dbRowId = inserted.id;
      }
    } catch (err) {
      console.error("Supabase createAccessRequest error:", err);
    }
  }

  return request;
}

/**
 * Retrieves all access requests, latest first
 */
export async function getAllAccessRequests(): Promise<AccessRequest[]> {
  const requests: AccessRequest[] = [...localRequests];

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("admins")
        .select("id, email, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        for (const row of data) {
          if (row.email?.startsWith("request:")) {
            try {
              const parsed: AccessRequest = JSON.parse(row.email.slice(8));
              parsed.dbRowId = row.id;
              if (!requests.some((r) => r.id === parsed.id)) {
                requests.push(parsed);
              } else {
                // Update dbRowId if already in local
                const existing = requests.find((r) => r.id === parsed.id);
                if (existing) {
                  existing.dbRowId = row.id;
                  existing.status = parsed.status;
                  existing.reviewedAt = parsed.reviewedAt;
                }
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Supabase getAllAccessRequests error:", err);
    }
  }

  // Sort descending by timestamp
  requests.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return requests;
}

/**
 * Updates the status of an access request (e.g. pending -> approved / rejected)
 */
export async function updateAccessRequestStatus(
  id: string,
  status: "pending" | "approved" | "rejected"
): Promise<AccessRequest | null> {
  const requests = await getAllAccessRequests();
  const target = requests.find((r) => r.id === id);

  if (!target) return null;

  target.status = status;
  target.reviewedAt = new Date().toISOString();

  // Update in local cache
  const localIdx = localRequests.findIndex((r) => r.id === id);
  if (localIdx !== -1) {
    localRequests[localIdx] = { ...target };
  } else {
    localRequests.unshift({ ...target });
  }

  const adminClient = createAdminClient();
  if (adminClient && target.dbRowId) {
    try {
      const updatedJson = JSON.stringify({
        id: target.id,
        firstName: target.firstName,
        lastName: target.lastName,
        contact: target.contact,
        note: target.note,
        status: target.status,
        timestamp: target.timestamp,
        reviewedAt: target.reviewedAt,
      });

      await adminClient
        .from("admins")
        .update({ email: `request:${updatedJson}` })
        .eq("id", target.dbRowId);
    } catch (err) {
      console.error("Supabase updateAccessRequestStatus error:", err);
    }
  }

  return target;
}
