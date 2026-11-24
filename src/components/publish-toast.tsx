import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { NeonCheck } from "@/components/ui/neon-check";

/**
 * Shows a persistent "busy" toast in the notification area (same location/style
 * as other toasts) using the ellipsis spinner. Always resolve it with one of the
 * helpers below, which replace it and auto-dismiss after a short delay.
 */
export function publishingToast(message: string): string | number {
  return toast.loading(message, {
    icon: <Spinner variant="ellipsis" className="h-4 w-4" />,
    duration: Infinity,
  });
}

/** Success, with the animated neon-green check. */
export function publishingSuccess(id: string | number, message = "Published") {
  toast.success(message, { id, icon: <NeonCheck />, duration: 4000 });
}

export function publishingWarning(id: string | number, message: string) {
  toast.warning(message, { id, duration: 6000 });
}

export function publishingError(id: string | number, message: string) {
  toast.error(message, { id, duration: 6000 });
}

/** Plain success (used for scheduling/cancelling). */
export function publishingDone(id: string | number, message: string) {
  toast.success(message, { id, duration: 4000 });
}
