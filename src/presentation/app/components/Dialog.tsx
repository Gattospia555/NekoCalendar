import { useEffect, useId, useRef, type ReactNode } from "react";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { Icon } from "./Icons";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/**
 * Finestra modale accessibile basata su `<dialog>`: il browser gestisce focus,
 * tasto Esc e sfondo. Si apre al montaggio e si chiude allo smontaggio.
 */
export function Dialog({ title, onClose, children, footer, wide = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dialog${wide ? " dialog-wide" : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault(); // chiudiamo noi, così React resta allineato
        onClose();
      }}
    >
      <header className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-btn" aria-label={t("event.close")} onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </header>
      <div className="dialog-body">{children}</div>
      {footer && <footer className="dialog-foot">{footer}</footer>}
    </dialog>
  );
}
