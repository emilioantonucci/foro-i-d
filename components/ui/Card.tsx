import type { ElementType, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  pad?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  accent?: boolean;
  children?: ReactNode;
}

/** Surface card built on design tokens. Use instead of inline card styles. */
export default function Card({
  as: Tag = "div",
  pad = "md",
  hover,
  accent,
  className,
  children,
  ...rest
}: CardProps) {
  const cls = [
    "dg-card",
    pad !== "none" ? `dg-card--pad-${pad}` : "",
    hover ? "dg-card--hover" : "",
    accent ? "dg-card--accent" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
