import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

/**
 * Shows a persistent "busy" toast in the notification area (same location/style
 * as other toasts) using the ellipsis spinner. Resolve it by passing the
 * returned id to toast.success / toast.error / toast.warning.
 */
export function publishingToast(message: string): string | number {
  return toast.loading(message, {
    icon: <Spinner variant="ellipsis" className="h-4 w-4" />,
    duration: Infinity,
  });
}
