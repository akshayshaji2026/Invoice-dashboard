import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import ActionModal from "../../components/ActionModal.jsx";

const DashboardModalContext = createContext(null);

const initialState = {
  open: false,
  title: "",
  body: null,
  confirmLabel: "OK",
  cancelLabel: "Close",
  onConfirm: null,
  tone: "default",
  footerMode: "default",
  maxWidthClass: "max-w-md",
};

export function DashboardModalProvider({ children }) {
  const [state, setState] = useState(initialState);

  const closeModal = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const openModal = useCallback((payload) => {
    setState({
      ...initialState,
      open: true,
      title: payload.title ?? "",
      body: payload.body ?? null,
      confirmLabel: payload.confirmLabel ?? "OK",
      cancelLabel: payload.cancelLabel ?? "Close",
      onConfirm: payload.onConfirm ?? null,
      tone: payload.tone ?? "default",
      footerMode: payload.footerMode ?? "default",
      maxWidthClass: payload.maxWidthClass ?? "max-w-md",
    });
  }, []);

  const value = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  const handleConfirm = () => {
    if (typeof state.onConfirm === "function") {
      state.onConfirm();
    }
    closeModal();
  };

  return (
    <DashboardModalContext.Provider value={value}>
      {children}
      <ActionModal
        open={state.open}
        onClose={closeModal}
        title={state.title}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        onConfirm={state.onConfirm ? handleConfirm : null}
        tone={state.tone}
        footerMode={state.footerMode}
        maxWidthClass={state.maxWidthClass}
      >
        {state.body}
      </ActionModal>
    </DashboardModalContext.Provider>
  );
}

export function useDashboardModal() {
  const ctx = useContext(DashboardModalContext);
  if (!ctx) {
    throw new Error("useDashboardModal must be used within DashboardModalProvider");
  }
  return ctx;
}
