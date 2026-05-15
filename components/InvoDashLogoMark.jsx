import React, { useId } from "react";

/**
 * Stylized “I” with floating four-point sparkles.
 * - `variant="default"`: blue–purple gradient (sidebar on light chip, favicon-style surfaces).
 * - `variant="onBlue"`: solid white mark for dark / blue gradient backgrounds.
 * Alias: `variant="inverse"` → same as `onBlue`.
 * - `color="white"`: same rendering as `onBlue` (optional shorthand).
 */
export default function InvoDashLogoMark({
  className = "",
  title = "Invo Dash",
  variant = "default",
  color,
}) {
  const onBlue = variant === "onBlue" || variant === "inverse" || color === "white";

  if (onBlue) {
    return (
      <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
      >
        <g fill="white">
          <g transform="translate(11.5, 9) scale(0.42)">
            <path d="M0 -3.2 L0.75 -0.75 L3.2 0 L0.75 0.75 L0 3.2 L-0.75 0.75 L-3.2 0 L-0.75 -0.75 Z" />
          </g>
          <g transform="translate(35, 10.5) scale(0.36)">
            <path d="M0 -3.2 L0.75 -0.75 L3.2 0 L0.75 0.75 L0 3.2 L-0.75 0.75 L-3.2 0 L-0.75 -0.75 Z" />
          </g>
          <g transform="translate(24, 6.2) scale(0.3)">
            <path d="M0 -3.2 L0.75 -0.75 L3.2 0 L0.75 0.75 L0 3.2 L-0.75 0.75 L-3.2 0 L-0.75 -0.75 Z" />
          </g>
        </g>
        <path
          fill="white"
          d="M17 15.5h14v2.4h-3.8V30.1h3.8v2.4H17v-2.4h3.8V17.9H17v-2.4Z"
        />
      </svg>
    );
  }

  const raw = useId();
  const gid = `invodash-${raw.replace(/:/g, "")}`;

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${gid}-i`} x1="22%" y1="0%" x2="78%" y2="100%">
          <stop offset="0%" stopColor="#9DABF5" />
          <stop offset="45%" stopColor="#4A5BB8" />
          <stop offset="100%" stopColor="#241B45" />
        </linearGradient>
        <linearGradient id={`${gid}-spark`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4F6FF" />
          <stop offset="100%" stopColor="#A8B8FF" />
        </linearGradient>
      </defs>

      <g opacity="0.95">
        <g transform="translate(11.5, 9) scale(0.42)">
          <path
            d="M0 -3.2 L0.75 -0.75 L3.2 0 L0.75 0.75 L0 3.2 L-0.75 0.75 L-3.2 0 L-0.75 -0.75 Z"
            fill={`url(#${gid}-spark)`}
          />
        </g>
        <g transform="translate(35, 10.5) scale(0.36)">
          <path
            d="M0 -3.2 L0.75 -0.75 L3.2 0 L0.75 0.75 L0 3.2 L-0.75 0.75 L-3.2 0 L-0.75 -0.75 Z"
            fill={`url(#${gid}-spark)`}
            opacity="0.88"
          />
        </g>
        <g transform="translate(24, 6.2) scale(0.3)">
          <path
            d="M0 -3.2 L0.75 -0.75 L3.2 0 L0.75 0.75 L0 3.2 L-0.75 0.75 L-3.2 0 L-0.75 -0.75 Z"
            fill={`url(#${gid}-spark)`}
            opacity="0.78"
          />
        </g>
      </g>

      <path
        fill={`url(#${gid}-i)`}
        d="M17 15.5h14v2.4h-3.8V30.1h3.8v2.4H17v-2.4h3.8V17.9H17v-2.4Z"
      />
    </svg>
  );
}
