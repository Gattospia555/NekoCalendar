import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { isInsideTransition } from "../motion/viewTransition";
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
  // Aperta da una trasformazione (evento → finestra)? Allora niente animazione d'entrata propria.
  const [morphed] = useState(isInsideTransition);

  // useLayoutEffect: la finestra si apre nello stesso istante del cambio di stato,
  // così la View Transition la trova già aperta nella seconda foto.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`dialog${wide ? " dialog-wide" : ""}${morphed ? " is-morphed" : ""}`}
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
