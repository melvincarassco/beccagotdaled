import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeName, formatGuestName } from "@/lib/utils";
import { Guest } from "@/types";

// In-memory fallback dataset for seamless local development
let localGuestsStore: Guest[] = [
  {
    id: "guest-becca-01",
    first_name: "Becca",
    last_name: "Miller",
    normalized_first_name: "becca",
    normalized_last_name: "miller",
    is_active: true,
    pin_code: "2026",
    created_at: new Date("2026-11-14T00:00:00Z").toISOString(),
  },
  {
    id: "guest-dale-02",
    first_name: "Dale",
    last_name: "Vance",
    normalized_first_name: "dale",
    normalized_last_name: "vance",
    is_active: true,
    pin_code: "2026",
    created_at: new Date("2026-11-14T00:00:00Z").toISOString(),
  },
  {
    id: "guest-sarah-03",
    first_name: "Sarah",
    last_name: "Jenkins",
    normalized_first_name: "sarah",
    normalized_last_name: "jenkins",
    is_active: true,
    pin_code: null,
    created_at: new Date("2026-11-14T00:00:00Z").toISOString(),
  },
  {
    id: "guest-marcus-04",
    first_name: "Marcus",
    last_name: "Vance",
    normalized_first_name: "marcus",
    normalized_last_name: "vance",
    is_active: true,
    pin_code: null,
    created_at: new Date("2026-11-14T00:00:00Z").toISOString(),
  },
  {
    id: "guest-eleanor-05",
    first_name: "Eleanor",
    last_name: "Pemberton",
    normalized_first_name: "eleanor",
    normalized_last_name: "pemberton",
    is_active: true,
    pin_code: null,
    created_at: new Date("2026-11-14T00:00:00Z").toISOString(),
  },
  {
    id: "guest-oliver-06",
    first_name: "Oliver",
    last_name: "Bennett",
    normalized_first_name: "oliver",
    normalized_last_name: "bennett",
    is_active: false, // Default turned off for testing activation toggle
    pin_code: null,
    created_at: new Date("2026-11-14T00:00:00Z").toISOString(),
  },
];

/**
 * Returns all guests, optionally filtered by search text and status
 */
export async function getAllGuests(filter?: { query?: string; activeOnly?: boolean }): Promise<Guest[]> {
  const adminClient = createAdminClient();

  if (adminClient) {
    try {
      let query = adminClient
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter?.activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (!error && data) {
        let results = data as Guest[];
        if (filter?.query) {
          const q = normalizeName(filter.query);
          results = results.filter(
            (g) =>
              g.normalized_first_name.includes(q) ||
              g.normalized_last_name.includes(q) ||
              `${g.normalized_first_name} ${g.normalized_last_name}`.includes(q)
          );
        }
        return results;
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to local store
  let results = [...localGuestsStore];
  if (filter?.activeOnly) {
    results = results.filter((g) => g.is_active);
  }
  if (filter?.query) {
    const q = normalizeName(filter.query);
    results = results.filter(
      (g) =>
        g.normalized_first_name.includes(q) ||
        g.normalized_last_name.includes(q) ||
        `${g.normalized_first_name} ${g.normalized_last_name}`.includes(q)
    );
  }
  return results;
}

/**
 * Live guest name suggestion for the autocomplete input
 */
export async function suggestGuests(searchTerm: string, limit = 6) {
  const normalized = normalizeName(searchTerm);
  if (!normalized || normalized.length < 1) {
    return [];
  }

  const allActive = await getAllGuests({ activeOnly: true });

  const matches = allActive
    .filter((g) => {
      const fullNormalized = `${g.normalized_first_name} ${g.normalized_last_name}`;
      return (
        g.normalized_first_name.startsWith(normalized) ||
        g.normalized_last_name.startsWith(normalized) ||
        fullNormalized.includes(normalized)
      );
    })
    .slice(0, limit);

  return matches.map((g) => ({
    id: g.id,
    firstName: g.first_name,
    lastName: g.last_name,
    fullName: `${g.first_name} ${g.last_name}`,
    requiresPin: !!g.pin_code,
  }));
}

/**
 * Finds a guest by normalized first & last name
 */
export async function findGuestByName(firstName: string, lastName: string): Promise<Guest | null> {
  const normFirst = normalizeName(firstName);
  const normLast = normalizeName(lastName);

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("guests")
        .select("*")
        .eq("normalized_first_name", normFirst)
        .eq("normalized_last_name", normLast)
        .maybeSingle();

      if (!error && data) {
        return data as Guest;
      }
    } catch {
      // Fallback below
    }
  }

  const found = localGuestsStore.find(
    (g) => g.normalized_first_name === normFirst && g.normalized_last_name === normLast
  );

  return found || null;
}

/**
 * Creates a new guest in the registry
 */
export async function createGuest(
  firstName: string,
  lastName: string,
  pinCode?: string | null,
  isActive: boolean = true
): Promise<Guest> {
  const normFirst = normalizeName(firstName);
  const normLast = normalizeName(lastName);
  const dispFirst = formatGuestName(firstName);
  const dispLast = formatGuestName(lastName);

  const newGuest: Guest = {
    id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    first_name: dispFirst,
    last_name: dispLast,
    normalized_first_name: normFirst,
    normalized_last_name: normLast,
    pin_code: pinCode?.trim() || null,
    is_active: isActive,
    created_at: new Date().toISOString(),
  };

  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("guests")
        .insert({
          first_name: dispFirst,
          last_name: dispLast,
          normalized_first_name: normFirst,
          normalized_last_name: normLast,
          pin_code: pinCode?.trim() || null,
          is_active: isActive,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Guest;
      }
    } catch {
      // Fallback
    }
  }

  localGuestsStore.unshift(newGuest);
  return newGuest;
}

/**
 * Toggles a guest's active status (turn on / off)
 */
export async function toggleGuestStatus(id: string, isActive: boolean): Promise<Guest | null> {
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient
        .from("guests")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        return data as Guest;
      }
    } catch {
      // Fallback
    }
  }

  const idx = localGuestsStore.findIndex((g) => g.id === id);
  if (idx !== -1) {
    localGuestsStore[idx] = {
      ...localGuestsStore[idx],
      is_active: isActive,
    };
    return localGuestsStore[idx];
  }

  return null;
}

/**
 * Deletes a guest from the registry
 */
export async function deleteGuest(id: string): Promise<boolean> {
  const adminClient = createAdminClient();
  if (adminClient) {
    try {
      const { error } = await adminClient.from("guests").delete().eq("id", id);
      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  const initialLen = localGuestsStore.length;
  localGuestsStore = localGuestsStore.filter((g) => g.id !== id);
  return localGuestsStore.length < initialLen;
}
