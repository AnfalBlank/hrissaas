"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D } from "@/components/Icon3D";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import {
  ArrowLeft,
  Download,
  FileText,
  Paperclip,
  Plus,
  Search,
  Send,
} from "lucide-react";

type View = "list" | "chat";

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatInner />
    </Suspense>
  );
}

function ChatInner() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const convFromUrl = searchParams.get("conv");

  const [view, setView] = useState<View>("list");
  const [activeConv, setActiveConv] = useState<{
    id: string;
    name: string;
    avatarUrl?: string;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });
  const myUserId = meData?.user?.id;

  const { data: convData, refetch: refetchConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.conversations(),
  });

  useRealtime("conv:message", () => {
    refetchConvs();
    qc.invalidateQueries({ queryKey: ["conv-messages"] });
  });

  const conversations = convData?.items ?? [];

  // Auto-open conversation from URL query param (e.g. from notif deep link)
  useEffect(() => {
    if (!convFromUrl || conversations.length === 0) return;
    const c = conversations.find((x: any) => x.id === convFromUrl);
    if (c) {
      const other = c.otherParticipants?.[0];
      setActiveConv({
        id: c.id,
        name: other?.name ?? "User",
        avatarUrl: other?.avatarUrl,
      });
      setView("chat");
    }
  }, [convFromUrl, conversations]);

  return (
    <div className="px-4 pt-4">
      {view === "list" ? (
        <>
          <PageHeader
            title="Chat"
            subtitle={`${conversations.length} percakapan`}
            right={
              <button
                onClick={() => setPickerOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow"
                title="Mulai chat baru"
              >
                <Plus className="h-4 w-4" />
              </button>
            }
          />

          <ul className="space-y-2">
            {conversations.length === 0 && (
              <li className="rounded-2xl bg-white p-8 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
                <Icon3D
                  name="chat"
                  size={64}
                  className="mx-auto opacity-50"
                />
                <p className="mt-3">Belum ada percakapan.</p>
                <p className="mt-1 text-xs">
                  Tap tombol + untuk mulai chat dengan rekan.
                </p>
              </li>
            )}
            {conversations.map((c: any) => {
              const other = c.otherParticipants?.[0];
              const initials =
                other?.name
                  ?.split(" ")
                  .map((s: string) => s[0])
                  .slice(0, 2)
                  .join("") ?? "?";
              const unread =
                c.lastMessageAt &&
                (!c.lastReadAt ||
                  new Date(c.lastMessageAt) > new Date(c.lastReadAt));
              return (
                <li
                  key={c.id}
                  onClick={() => {
                    setActiveConv({
                      id: c.id,
                      name: other?.name ?? "User",
                      avatarUrl: other?.avatarUrl,
                    });
                    setView("chat");
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 shadow-soft border border-ink-100 transition active:scale-[0.99]"
                >
                  <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-brand-100 font-bold text-brand-700">
                    {other?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={other.avatarUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{other?.name}</p>
                    <p className="truncate text-xs text-ink-500">
                      {c.lastMessageText ?? "Mulai percakapan..."}
                    </p>
                  </div>
                  {unread && (
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <ChatRoom
          conv={activeConv!}
          myUserId={myUserId}
          onBack={() => {
            setView("list");
            refetchConvs();
          }}
        />
      )}

      {pickerOpen && (
        <ContactPicker
          onClose={() => setPickerOpen(false)}
          onPick={async (userId, name, avatarUrl) => {
            const r = await api.startConversation(userId);
            setActiveConv({ id: r.conversationId, name, avatarUrl });
            setView("chat");
            setPickerOpen(false);
            refetchConvs();
          }}
        />
      )}
    </div>
  );
}

function ChatRoom({
  conv,
  myUserId,
  onBack,
}: {
  conv: { id: string; name: string; avatarUrl?: string };
  myUserId: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ["conv-messages", conv.id],
    queryFn: () => api.conversationMessages(conv.id),
    refetchInterval: 5000, // fallback polling kalau Socket.IO mati
  });

  useRealtime<any>("conv:message", (payload) => {
    if (payload.conversationId === conv.id) refetch();
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: (data: any) => api.sendMessage(conv.id, data),
    onSuccess: () => {
      setText("");
      refetch();
    },
  });

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("Maksimal 5MB");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      const upload = await api.uploadDataUrl(dataUrl, file.name, "leave");
      send.mutate({
        attachmentUrl: upload.url,
        attachmentName: file.name,
        attachmentMime: file.type,
        attachmentSize: file.size,
        text: text.trim() || undefined,
      });
    } catch (e: any) {
      alert(e.message || "Gagal upload");
    } finally {
      setUploading(false);
    }
  }

  function handleSend() {
    if (!text.trim()) return;
    send.mutate({ text: text.trim() });
  }

  const fmt = (ts: any) =>
    ts
      ? new Date(ts).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const initials =
    conv.name
      ?.split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("") ?? "?";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="sticky top-0 z-20 -mx-4 mb-2 flex items-center gap-3 bg-ink-50/80 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-white border border-ink-100 shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-xs font-bold text-brand-700">
          {conv.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conv.avatarUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold leading-tight">{conv.name}</p>
          <p className="text-[11px] text-ink-500">Online</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-3">
        <div className="space-y-2 px-1">
          {messages.length === 0 && (
            <div className="rounded-2xl bg-white p-4 text-center text-xs text-ink-500 shadow-soft border border-ink-100">
              Mulai chat dengan {conv.name}.
            </div>
          )}
          {messages.map((m: any) => {
            const mine = m.fromUserId === myUserId;
            const hasImage = m.attachmentMime?.startsWith("image/");
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl shadow-soft ${
                    mine
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md bg-white text-ink-800 border border-ink-100"
                  }`}
                >
                  {m.attachmentUrl && (
                    <div className="p-2">
                      {hasImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.attachmentUrl}
                          alt={m.attachmentName ?? ""}
                          className="max-h-64 rounded-xl object-cover"
                        />
                      ) : (
                        <a
                          href={m.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={m.attachmentName}
                          className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
                            mine
                              ? "bg-white/15 hover:bg-white/25"
                              : "bg-ink-50 hover:bg-ink-100"
                          }`}
                        >
                          <FileText className="h-5 w-5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                              {m.attachmentName ?? "File"}
                            </p>
                            {m.attachmentSize ? (
                              <p
                                className={`text-[10px] ${mine ? "text-white/70" : "text-ink-400"}`}
                              >
                                {(m.attachmentSize / 1024).toFixed(1)} KB
                              </p>
                            ) : null}
                          </div>
                          <Download className="h-4 w-4 shrink-0" />
                        </a>
                      )}
                    </div>
                  )}
                  {m.text && (
                    <p className="px-3 py-2 text-sm">{m.text}</p>
                  )}
                  <p
                    className={`px-3 pb-2 text-right text-[10px] ${
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="grid h-10 w-10 place-items-center rounded-xl text-ink-500 hover:bg-ink-50 disabled:opacity-50"
          title="Lampirkan file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && text.trim() && !send.isPending && handleSend()
          }
          placeholder={uploading ? "Mengupload..." : "Tulis pesan..."}
          disabled={uploading}
          className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || send.isPending}
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-glow disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ContactPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (userId: string, name: string, avatarUrl?: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => api.contacts(),
  });

  const items = (data?.items ?? []).filter((c: any) =>
    q
      ? c.fullName?.toLowerCase().includes(q.toLowerCase()) ||
        c.position?.toLowerCase().includes(q.toLowerCase()) ||
        c.email?.toLowerCase().includes(q.toLowerCase())
      : true
  );

  return (
    <Modal open onClose={onClose} title="Mulai Chat Baru" size="md">
      <div className="space-y-3 p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama, posisi, atau email..."
            className="input pl-9"
          />
        </div>
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
          {items.length === 0 && (
            <li className="rounded-xl bg-ink-50 p-4 text-center text-xs text-ink-500">
              Tidak ada kontak.
            </li>
          )}
          {items.map((c: any) => {
            const initials =
              c.fullName
                ?.split(" ")
                .map((s: string) => s[0])
                .slice(0, 2)
                .join("") ?? c.email?.[0] ?? "?";
            return (
              <li
                key={c.userId}
                onClick={() =>
                  onPick(c.userId, c.fullName ?? c.email, c.avatarUrl)
                }
                className="flex cursor-pointer items-center gap-3 rounded-2xl p-2 hover:bg-ink-50"
              >
                <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-xs font-bold text-brand-700">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {c.fullName ?? c.email}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {c.position ?? c.email} {c.division && `· ${c.division}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
