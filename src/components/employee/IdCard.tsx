"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  IdCard as IdCardIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  X,
  Download,
  FileText,
} from "lucide-react";

export function IdCard({
  open,
  onClose,
  user,
  employee,
  branch,
  company,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
  employee: any;
  branch?: any;
  company?: { name: string } | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"" | "png" | "pdf">("");

  if (!open) return null;
  const initials =
    employee?.fullName
      ?.split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("") ?? "?";

  const fmtDate = (d: any) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

  const companyName = company?.name ?? "PT Manggala Sejahtera";

  async function downloadPng() {
    if (!cardRef.current) return;
    setBusy("png");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.download = `id-card-${employee?.employeeCode ?? "card"}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e: any) {
      alert("Gagal export PNG: " + e.message);
    } finally {
      setBusy("");
    }
  }

  async function downloadPdf() {
    if (!cardRef.current) return;
    setBusy("pdf");
    try {
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });
      // ID card typical aspect ~ 380x540 → A4 portrait, centered
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = 210;
      const pageH = 297;
      const cardW = 90; // mm
      const cardH = 128; // mm (5:7 aspect)
      const x = (pageW - cardW) / 2;
      const y = 30;
      pdf.addImage(dataUrl, "PNG", x, y, cardW, cardH);
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(
        `Dicetak ${new Date().toLocaleDateString("id-ID")} · ${companyName}`,
        pageW / 2,
        pageH - 15,
        { align: "center" }
      );
      pdf.save(`id-card-${employee?.employeeCode ?? "card"}.pdf`);
    } catch (e: any) {
      alert("Gagal export PDF: " + e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" sheetOnMobile={false}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-lg font-bold">ID Card Pegawai</p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink-500 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ============== ID CARD ============== */}
        <div
          ref={cardRef}
          className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[28px] bg-white shadow-card"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          {/* Header gradient with curve */}
          <div className="relative">
            <div
              className="relative px-5 pt-5 pb-24"
              style={{
                background:
                  "linear-gradient(135deg, #2336c4 0%, #3a5cff 50%, #ff7a59 100%)",
              }}
            >
              <div className="flex items-start justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
                    <Logo size={32} />
                  </div>
                  <div>
                    <p
                      className="font-extrabold leading-tight"
                      style={{ fontSize: 14 }}
                    >
                      {companyName}
                    </p>
                    <p
                      className="font-medium tracking-[0.18em] text-white/80"
                      style={{ fontSize: 9 }}
                    >
                      EMPLOYEE CARD
                    </p>
                  </div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/30">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            {/* Curved white overlay creates the wave */}
            <svg
              className="absolute -bottom-1 left-0 w-full"
              viewBox="0 0 340 60"
              preserveAspectRatio="none"
              style={{ height: 50 }}
            >
              <path
                d="M0,40 Q170,0 340,40 L340,60 L0,60 Z"
                fill="white"
              />
            </svg>
          </div>

          {/* Avatar overlapping header */}
          <div className="relative -mt-20 grid place-items-center">
            <div className="relative h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-white bg-brand-100 shadow-xl">
              {employee?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.avatarUrl}
                  alt={employee.fullName}
                  className="absolute inset-0 h-full w-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="grid h-full place-items-center text-3xl font-extrabold text-brand-700">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Name + position */}
          <div className="px-5 pt-4 text-center">
            <p
              className="font-extrabold tracking-tight text-ink-900"
              style={{ fontSize: 26, lineHeight: 1.1 }}
            >
              {employee?.fullName ?? "-"}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {employee?.position ?? "-"}
            </p>

            {/* Division pill with dotted leaders */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-300 to-brand-500" />
              <span className="rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-1 text-xs font-bold text-white shadow">
                {employee?.division ?? "—"}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-accent-300 to-accent-600" />
            </div>
          </div>

          {/* Info grid 2x3 */}
          <div className="grid grid-cols-2 gap-2 px-4 py-4">
            <InfoCell
              icon={<IdCardIcon className="h-3.5 w-3.5 text-brand-700" />}
              label="ID"
              value={employee?.employeeCode ?? "-"}
            />
            <InfoCell
              icon={<ShieldCheck className="h-3.5 w-3.5 text-brand-700" />}
              label="STATUS"
              value={
                employee?.status === "active"
                  ? "Aktif"
                  : (employee?.status ?? "-")
              }
            />
            <InfoCell
              icon={<Calendar className="h-3.5 w-3.5 text-brand-700" />}
              label="BERGABUNG"
              value={fmtDate(employee?.joinDate)}
            />
            <InfoCell
              icon={<MapPin className="h-3.5 w-3.5 text-brand-700" />}
              label="CABANG"
              value={branch?.name ?? "-"}
            />
            <InfoCell
              icon={<Mail className="h-3.5 w-3.5 text-brand-700" />}
              label="EMAIL"
              value={user?.email ?? "-"}
            />
            <InfoCell
              icon={<Phone className="h-3.5 w-3.5 text-brand-700" />}
              label="TELEPON"
              value={employee?.phone ?? "-"}
            />
          </div>

          {/* Footer dark bar with logo + accents */}
          <div
            className="relative overflow-hidden px-5 py-4"
            style={{
              background:
                "linear-gradient(135deg, #161b54 0%, #1f2aae 100%)",
            }}
          >
            {/* Decorative dots */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <div className="relative flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-brand-400" />
              <Logo size={22} className="ring-2 ring-white/30" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent-500" />
            </div>
            <p
              className="relative mt-2 text-center font-bold tracking-[0.25em] text-white/90"
              style={{ fontSize: 10 }}
            >
              {companyName.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={downloadPng}
            disabled={!!busy}
          >
            <Download className="h-4 w-4" />
            {busy === "png" ? "Mengunduh..." : "PNG"}
          </Button>
          <Button onClick={downloadPdf} disabled={!!busy}>
            <FileText className="h-4 w-4" />
            {busy === "pdf" ? "Mengunduh..." : "PDF"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-ink-50 p-3 ring-1 ring-ink-100">
      <div className="flex items-start gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-bold tracking-widest text-ink-400"
            style={{ fontSize: 8 }}
          >
            {label}
          </p>
          <p className="truncate text-xs font-bold text-ink-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
