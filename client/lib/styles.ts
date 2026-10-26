export type Variant = "primary" | "secondary" | "danger" | "ghost";
export type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
  secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  ghost: "text-slate-600 hover:bg-slate-100",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]}`;
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";