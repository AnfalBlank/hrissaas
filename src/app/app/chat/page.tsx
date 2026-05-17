"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D } from "@/components/Icon3D";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { Send, Paperclip } from "lucide-react";

export default function ChatPage() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });
  const { data } = useQuery({
    queryKey: ["chat"],
    queryFn: () => api.chatList(),
  });

  const myUserId = meData?.user?.id;
  const items = data?.items ?? [];

  const send = useMutation({
    mutationFn: () => api.chatSend(text),
    onMutate: () => setText(""),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat"] }),
  });

  const { connected } = useRealtime<{ item: any }>("chat:message", () => {
    qc.invalidateQueries({ queryKey: ["chat"] });
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [items.length]);

  const fmt = (ts: any) =>
    ts
      ? new Date(ts).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col px-4 pt-4">
      <PageHeader
        title="HR Support"
        subtitle={connected ? "Online · respons cepat" : "Connecting..."}
        right={<Icon3D name="chat" size={36} />}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-3">
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="rounded-2xl bg-white p-4 text-center text-xs text-ink-500 shadow-soft border border-ink-100">
              Mulai percakapan dengan tim HR.
            </div>
          )}
          {items.map((m: any) => {
            const mine = m.fromUserId === myUserId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-soft ${
                    mine
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md bg-white text-ink-800 border border-ink-100"
                  }`}
                >
                  <p>{m.text}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      mine ? "text-white/70" : "text-ink-400"
                    }`}
                  >
                    {fmt(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 mt-2 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-soft border border-ink-100">
        <button className="grid h-10 w-10 place-items-center rounded-xl text-ink-500 hover:bg-ink-50">
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && text.trim() && !send.isPending && send.mutate()
          }
          placeholder="Tulis pesan..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button
          onClick={() => text.trim() && send.mutate()}
          disabled={!text.trim() || send.isPending}
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-glow disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
