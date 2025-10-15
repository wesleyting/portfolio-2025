"use client";

export default function TextRolloverScoped({ text, className = "", duration = 300 }) {
  return (
    <span
      className={`relative inline-block overflow-hidden align-baseline ${className}`}
      style={{ height: "1em", lineHeight: 1 }}
    >
      <span
        className="block translate-y-0 transition-transform ease-out group-hover:-translate-y-full"
        style={{ transitionDuration: `${duration}ms` }}
      >
        {text}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-full transition-transform ease-out group-hover:translate-y-0"
        style={{ transitionDuration: `${duration}ms` }}
      >
        {text}
      </span>
    </span>
  );
}
