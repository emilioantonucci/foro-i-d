import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Spinner from "./Spinner";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  /** Leading icon (hidden while loading; replaced by the spinner). */
  icon?: ReactNode;
  /** Trailing icon. */
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buildClass(
  variant: Variant,
  size: Size,
  block: boolean | undefined,
  extra: string | undefined
) {
  return [
    "dg-btn",
    `dg-btn--${variant}`,
    size === "sm" ? "dg-btn--sm" : size === "lg" ? "dg-btn--lg" : "",
    block ? "dg-btn--block" : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    block,
    icon,
    iconRight,
    className,
    children,
    ...rest
  } = props;

  const cls = buildClass(variant, size, block, className);
  const content = (
    <>
      {loading ? <Spinner size={size === "sm" ? 14 : 16} /> : icon}
      {children}
      {!loading && iconRight}
    </>
  );

  if (props.href != null) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <Link
        href={href}
        className={cls}
        aria-busy={loading || undefined}
        {...anchorRest}
      >
        {content}
      </Link>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      className={cls}
      aria-busy={loading || undefined}
      disabled={loading || buttonRest.disabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
