"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { emptyLearningState } from "@/data/progress";
import { hasMeaningfulProgress, normalizeLearningStateForUser, type ServerLearningPayload } from "@/lib/learning/server-state";
import { LEARNING_EVENT, readLearningState, setActiveLearningUser, writeLearningState } from "@/lib/storage/learning-storage";
import type { LearningState } from "@/types/progress";

export const SYNC_STATUS_EVENT = "deutschimo-sync-status";
export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "offline" | "error";

function announce(status: SyncStatus) {
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: status }));
}

export function LearningSyncBridge() {
  const { data: session, status } = useSession();
  const hydrated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    let cancelled = false;
    hydrated.current = false;

    async function hydrate() {
      if (status === "loading") return;
      if (status !== "authenticated" || !session?.user.id) {
        setActiveLearningUser(null);
        announce("idle");
        hydrated.current = true;
        return;
      }

      announce("loading");
      setActiveLearningUser(session.user.id);
      const local = normalizeLearningStateForUser(readLearningState(), session.user.id);
      try {
        const response = await fetch("/api/progress", { cache: "no-store" });
        if (!response.ok) throw new Error("progress_fetch_failed");
        const payload = await response.json() as ServerLearningPayload;
        if (cancelled) return;
        if (payload.state) {
          writeLearningState(normalizeLearningStateForUser(payload.state, session.user.id));
        } else if (hasMeaningfulProgress(local)) {
          await saveToServer(local);
        } else {
          const fresh = normalizeLearningStateForUser(structuredClone(emptyLearningState) as LearningState, session.user.id);
          writeLearningState(fresh);
          await saveToServer(fresh);
        }
        announce("saved");
      } catch {
        if (!cancelled) announce(navigator.onLine ? "error" : "offline");
      } finally {
        if (!cancelled) hydrated.current = true;
      }
    }

    async function saveToServer(state: LearningState) {
      const response = await fetch("/api/progress", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state }) });
      if (!response.ok) throw new Error("progress_save_failed");
    }

    hydrate();
    return () => { cancelled = true; };
  }, [session?.user.id, status]);

  useEffect(() => {
    async function sync() {
      if (!hydrated.current || status !== "authenticated" || !session?.user.id || saving.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        saving.current = true;
        announce("saving");
        try {
          const state = normalizeLearningStateForUser(readLearningState(), session.user.id);
          const response = await fetch("/api/progress", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state }) });
          if (!response.ok) throw new Error("progress_save_failed");
          announce("saved");
        } catch {
          announce(navigator.onLine ? "error" : "offline");
        } finally {
          saving.current = false;
        }
      }, 900);
    }
    window.addEventListener(LEARNING_EVENT, sync);
    return () => {
      window.removeEventListener(LEARNING_EVENT, sync);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [session?.user.id, status]);

  return null;
}
