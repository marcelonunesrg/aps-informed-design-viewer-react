import { useCallback } from "react";

export interface LogoutConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function useLogoutConfirmDialog({
  onCancel,
  onConfirm,
}: Pick<LogoutConfirmDialogProps, "onCancel" | "onConfirm">) {
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  return {
    handleCancel,
    handleConfirm,
  };
}
