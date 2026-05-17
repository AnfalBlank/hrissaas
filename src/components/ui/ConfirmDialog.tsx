"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  icon = "warning",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  icon?: Icon3DName;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" sheetOnMobile={false}>
      <div className="p-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center">
          <Icon3D name={icon} size={72} />
        </div>
        <p className="mt-3 font-display text-lg font-bold">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-ink-500">{description}</p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
