import { toast } from "sonner";

const copyToClipboard = (value) => {
  navigator.clipboard?.writeText(value).catch(() => {
    /* ignore clipboard failures */
  });
};

export const showCopyableErrorToast = (title, error) => {
  const message = error instanceof Error ? error.message : String(error);
  const details = [title, message].filter(Boolean).join("\n");

  toast.error(title, {
    description: message,
    duration: 12_000,
    action: {
      label: "Copy",
      onClick: () => copyToClipboard(details),
    },
  });
};

