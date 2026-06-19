import {
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";

/* ---- Raw controls -------------------------------------------------------- */

type WithInvalid = { invalid?: boolean };

export function Input({
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & WithInvalid) {
  return (
    <input
      className={`dg-input ${invalid ? "dg-input--invalid" : ""} ${className ?? ""}`.trim()}
      {...rest}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & WithInvalid) {
  return (
    <textarea
      className={`dg-input ${invalid ? "dg-input--invalid" : ""} ${className ?? ""}`.trim()}
      {...rest}
    />
  );
}

export function Select({
  invalid,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & WithInvalid) {
  return (
    <select
      className={`dg-input ${invalid ? "dg-input--invalid" : ""} ${className ?? ""}`.trim()}
      {...rest}
    />
  );
}

/* ---- Field wrapper ------------------------------------------------------- */

interface FieldProps {
  /** Wires label `htmlFor`, control `id`, and aria-describedby. */
  id: string;
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  /** Optional character counter shown on the right of the footer. */
  count?: { value: number; max: number };
  /** A single control element (Input / Textarea / Select). */
  children: ReactNode;
}

/**
 * Accessible form field: label + control + hint/error + optional counter.
 * Clones the child control to inject `id`, `aria-invalid`, `aria-describedby`
 * and the `invalid` styling so consumers don't have to wire it by hand.
 */
export default function Field({
  id,
  label,
  required,
  hint,
  error,
  count,
  children,
}: FieldProps) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  // Si el hijo es un elemento host (div, input nativo…) no le inyectamos
  // `invalid`: solo lo entienden nuestros controles (Input/Textarea/Select) y
  // React avisaría que no es un atributo DOM válido. `id`/`aria-*` sí son
  // válidos en cualquier elemento.
  const isHostElement =
    isValidElement(children) && typeof (children as ReactElement).type === "string";

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        ...(isHostElement
          ? {}
          : {
              invalid:
                !!error ||
                ((children as ReactElement<{ invalid?: boolean }>).props.invalid ?? false),
            }),
      })
    : children;

  return (
    <div className="dg-field">
      {label && (
        <label className="dg-label" htmlFor={id}>
          {label}
          {required && (
            <span className="dg-label__req" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {control}
      {(hint || error || count) && (
        <div className="dg-field__foot">
          {error ? (
            <span className="dg-error-text" id={`${id}-error`} role="alert">
              <AlertCircle size={13} aria-hidden="true" />
              {error}
            </span>
          ) : hint ? (
            <span className="dg-hint" id={`${id}-hint`}>
              {hint}
            </span>
          ) : (
            <span />
          )}
          {count && (
            <span
              className={`dg-charcount ${
                count.value > count.max ? "dg-charcount--over" : ""
              }`.trim()}
            >
              {count.value}/{count.max}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
