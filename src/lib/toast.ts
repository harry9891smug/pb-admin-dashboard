import toast from "react-hot-toast";
export const toastSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
  });
};

export const toastError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: "top-right",
  });
};

export const toastLoading = (message: string) => {
  return toast.loading(message, {
    position: "top-right",
  });
};

export const toastUpdate = (toastId: string, type: "success" | "error" | "loading", message: string) => {
  if (type === "success") {
    toast.success(message, {
      id: toastId,
      duration: 3000,
    });
  } else if (type === "error") {
    toast.error(message, {
      id: toastId,
      duration: 4000,
    });
  } else {
    toast.loading(message, {
      id: toastId,
    });
  }
};

export const toastDismiss = (toastId?: string) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

export const toastPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: (err) => messages.error,
    },
    {
      position: "top-right",
    }
  );
};

export const toastCustom = (
  message: string,
  icon?: React.ReactNode,
  options?: any
) => {
  return toast(message, {
    icon,
    position: "top-right",
    ...options,
  });
};