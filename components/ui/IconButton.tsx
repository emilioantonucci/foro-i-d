import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type CommonProps = {
  /** Required for accessibility — describes the action for screen readers. */
  label: string;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
};

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "aria-label"> & {
    href?: undefined;
  };

type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "aria-label"> & {
    href: string;
  };

export type IconButtonProps = AsButton | AsLink;

/** Icon-only button with a mandatory accessible label. */
export default function IconButton(props: IconButtonProps) {
  const { label, size = "md", className, children, ...rest } = props;
  const cls = [
    "dg-iconbtn",
    size === "sm" ? "dg-iconbtn--sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (props.href != null) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <Link href={href} className={cls} aria-label={label} title={label} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type="button"
      className={cls}
      aria-label={label}
      title={label}
      {...buttonRest}
    >
      {children}
    </button>
  );
}
