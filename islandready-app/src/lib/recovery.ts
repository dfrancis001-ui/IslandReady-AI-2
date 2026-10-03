// IslandReady AI — membership-scoped Recovery Hub helpers (Phase 10).
// EVERY operation verifies household membership first; record-level ops
// additionally verify the record belongs to the household (defense in depth
// against [recordId]/[taskId] tampering). Photo binaries live on the local
// filesystem (UPLOAD_DIR or islandready-app/uploads/); only metadata is in DB.
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getPool, query } from "./db";
import { requireMembership } from "./households";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

function rid(prefix: string): string {
  return `${prefix}-` + randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Server-side magic-byte sniff. Filename and client MIME are never trusted. */
export function sniffImage(buf: Buffer): "image/jpeg" | "image/png" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "image/png";
  }
  return null;
}

/** Re-encode through sharp (drops EXIF/GPS/ancillary metadata) + auto-orient. */
export async function stripToSafeImage(buf: Buffer, mime: "image/jpeg" | "image/png"): Promise<Buffer> {
  const base = sharp(buf).rotate();
  return mime === "image/jpeg"
    ? base.jpeg({ quality: 90 }).toBuffer()
    : base.png().toBuffer();
}

export async function listRecords(userId: string, householdId: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  const { rows } = await query(
    `SELECT r.id, r.title, r.note, r.updated_at AS "updatedAt",
            (p.id IS NOT NULL) AS "hasPhoto"
     FROM recovery_records r LEFT JOIN recovery_photos p ON p.record_id = r.id
     WHERE r.household_id = $1 ORDER BY r.updated_at DESC`,
    [householdId]
  );
  return rows;
}

export async function createRecord(userId: string, householdId: string, title: string, note: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  const t = title.trim().slice(0, 150);
  if (!t) return { error: "Title is required." } as const;
  const id = rid("rr");
  await query(
    "INSERT INTO recovery_records (id, household_id, title, note) VALUES ($1, $2, $3, $4)",
    [id, householdId, t, note.trim().slice(0, 2000)]
  );
  return { id };
}

async function ownedRecord(householdId: string, recordId: string) {
  const { rows } = await query(
    "SELECT id, household_id FROM recovery_records WHERE id = $1 AND household_id = $2",
    [recordId, householdId]
  );
  return rows[0] ?? null;
}

export async function getRecord(userId: string, householdId: string, recordId: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  if (!(await ownedRecord(householdId, recordId))) return null;
  const rec = (
    await query("SELECT id, title, note FROM recovery_records WHERE id = $1", [recordId])
  ).rows[0];
  const photo = (
    await query(
      "SELECT id, filename, mime, bytes FROM recovery_photos WHERE record_id = $1",
      [recordId]
    )
  ).rows[0] ?? null;
  return { ...rec, photo };
}

export async function updateRecord(
  userId: string, householdId: string, recordId: string, title: string, note: string
): Promise<"ok" | "not-found" | { error: string }> {
  if (!(await requireMembership(userId, householdId))) return "not-found";
  if (!(await ownedRecord(householdId, recordId))) return "not-found";
  const t = title.trim().slice(0, 150);
  if (!t) return { error: "Title is required." };
  await query(
    "UPDATE recovery_records SET title = $1, note = $2, updated_at = now() WHERE id = $3",
    [t, note.trim().slice(0, 2000), recordId]
  );
  return "ok";
}

export async function deleteRecord(
  userId: string, householdId: string, recordId: string
): Promise<boolean> {
  if (!(await requireMembership(userId, householdId))) return false;
  if (!(await ownedRecord(householdId, recordId))) return false;
  const photo = (
    await query("SELECT stored_path FROM recovery_photos WHERE record_id = $1", [recordId])
  ).rows[0] as { stored_path: string } | undefined;
  await query("DELETE FROM recovery_records WHERE id = $1", [recordId]);
  if (photo) {
    try {
      await fs.unlink(photo.stored_path);
    } catch {
      // Row is gone (cascade cleared metadata); a missing file is already the desired end state.
    }
  }
  return true;
}

export async function addPhoto(
  userId: string, householdId: string, recordId: string, buf: Buffer
): Promise<{ id: string } | { error: string; status: number } | null> {
  if (!(await requireMembership(userId, householdId))) return null;
  if (!(await ownedRecord(householdId, recordId))) return null;
  if (buf.length === 0) return { error: "Empty upload rejected.", status: 400 };
  if (buf.length > MAX_PHOTO_BYTES) return { error: "Photo exceeds 5 MB.", status: 400 };
  const mime = sniffImage(buf);
  if (!mime) return { error: "Only JPEG or PNG images are accepted.", status: 400 };
  const existing = await query("SELECT 1 FROM recovery_photos WHERE record_id = $1", [recordId]);
  if ((existing.rowCount ?? 0) > 0) {
    return { error: "This record already has a photo (max 1 per record).", status: 409 };
  }
  let safe: Buffer;
  try {
    safe = await stripToSafeImage(buf, mime);
  } catch {
    return { error: "Unreadable image file.", status: 400 };
  }
  const id = rid("rp");
  const filename = `${id}${mime === "image/jpeg" ? ".jpg" : ".png"}`;
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const stored_path = path.join(dir, filename);
  await fs.writeFile(stored_path, safe);
  try {
    await query(
      "INSERT INTO recovery_photos (id, record_id, household_id, filename, mime, bytes, stored_path) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, recordId, householdId, filename, mime, safe.length, stored_path]
    );
  } catch {
    try {
      await fs.unlink(stored_path);
    } catch {
      // ignore
    }
    throw new Error("Unable to save photo.");
  }
  return { id };
}

export async function getPhoto(
  userId: string, householdId: string, recordId: string
): Promise<{ path: string; mime: string } | null> {
  if (!(await requireMembership(userId, householdId))) return null;
  if (!(await ownedRecord(householdId, recordId))) return null;
  const row = (
    await query("SELECT stored_path, mime FROM recovery_photos WHERE record_id = $1", [recordId])
  ).rows[0] as { stored_path: string; mime: string } | undefined;
  if (!row) return null;
  try {
    await fs.access(row.stored_path);
  } catch {
    return null;
  }
  return { path: row.stored_path, mime: row.mime };
}

export async function listTasks(userId: string, householdId: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  const { rows } = await query(
    "SELECT id, label, done FROM recovery_tasks WHERE household_id = $1 ORDER BY position, id",
    [householdId]
  );
  return rows;
}

export async function addTask(userId: string, householdId: string, label: string) {
  if (!(await requireMembership(userId, householdId))) return null;
  const l = label.trim().slice(0, 200);
  if (!l) return { error: "Label is required." } as const;
  const { rows } = await query(
    "INSERT INTO recovery_tasks (household_id, label) VALUES ($1, $2) RETURNING id",
    [householdId, l]
  );
  return { id: rows[0].id };
}

export async function updateTask(
  userId: string, householdId: string, taskId: number, patch: { label?: unknown; done?: unknown }
): Promise<"ok" | "not-found" | { error: string }> {
  if (!(await requireMembership(userId, householdId))) return "not-found";
  const owns = await query(
    "SELECT 1 FROM recovery_tasks WHERE id = $1 AND household_id = $2",
    [taskId, householdId]
  );
  if ((owns.rowCount ?? 0) === 0) return "not-found";
  if (patch.label !== undefined) {
    const l = String(patch.label).trim().slice(0, 200);
    if (!l) return { error: "Label is required." };
    await query("UPDATE recovery_tasks SET label = $1 WHERE id = $2", [l, taskId]);
  }
  if (typeof patch.done === "boolean") {
    await query("UPDATE recovery_tasks SET done = $1 WHERE id = $2", [patch.done, taskId]);
  }
  return "ok";
}

export async function deleteTask(
  userId: string, householdId: string, taskId: number
): Promise<boolean> {
  if (!(await requireMembership(userId, householdId))) return false;
  const r = await query(
    "DELETE FROM recovery_tasks WHERE id = $1 AND household_id = $2",
    [taskId, householdId]
  );
  return (r.rowCount ?? 0) > 0;
}
