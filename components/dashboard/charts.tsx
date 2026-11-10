import type { LucideIcon } from "lucide-react";

export const palette = {
  navy: "#102a43",
  blue: "#2563eb",
  cyan: "#0ea5e9",
  teal: "#0f9f8f",
  amber: "#f59e0b",
  coral: "#f97360",
  red: "#dc4c64",
};

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
        {eyebrow}
      </span>
      <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "blue" | "teal" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${tones[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

export function LineChart({
  data,
  primaryLabel,
  secondaryLabel,
}: {
  data: { label: string; primary: number; secondary: number }[];
  primaryLabel: string;
  secondaryLabel: string;
}) {
  const width = 620;
  const height = 230;
  const padding = { left: 44, right: 20, top: 24, bottom: 40 };
  const max = Math.max(...data.flatMap((item) => [item.primary, item.secondary])) * 1.12;
  const x = (index: number) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(data.length - 1, 1);
  const y = (value: number) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);
  const points = (key: "primary" | "secondary") => data.map((item, index) => `${x(index)},${y(item[key])}`).join(" ");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-blue-600" />{primaryLabel}</span>
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-500" />{secondaryLabel}</span>
      </div>
      <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img">
        <title>{`Evolução mensal de ${primaryLabel} e ${secondaryLabel}`}</title>
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const yy = y(max * ratio);
          return (
            <g key={ratio}>
              <line x1={padding.left} x2={width - padding.right} y1={yy} y2={yy} stroke="#e2e8f0" />
              <text x={padding.left - 8} y={yy + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(max * ratio)}</text>
            </g>
          );
        })}
        <polyline points={points("primary")} fill="none" stroke={palette.blue} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points("secondary")} fill="none" stroke={palette.amber} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 6" />
        {data.map((item, index) => (
          <g key={item.label}>
            <circle cx={x(index)} cy={y(item.primary)} r="5" fill="white" stroke={palette.blue} strokeWidth="3" />
            <circle cx={x(index)} cy={y(item.secondary)} r="4" fill="white" stroke={palette.amber} strokeWidth="2.5" />
            <text x={x(index)} y={height - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">{item.label}</text>
            <text x={x(index)} y={y(item.primary) - 11} textAnchor="middle" fontSize="11" fontWeight="700" fill={palette.blue}>{formatNumber(item.primary)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function GroupedBars({ data }: { data: { label: string; first: number; second: number }[] }) {
  const max = Math.max(...data.flatMap((item) => [item.first, item.second]));
  return (
    <div>
      <div className="mb-5 flex gap-4 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-teal-500" />Acessos</span>
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-cyan-400" />Operações</span>
      </div>
      <div className="flex h-56 items-end justify-around gap-5 border-b border-slate-200 px-2">
        {data.map((item) => (
          <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-[82%] w-full max-w-24 items-end justify-center gap-2">
              <div className="relative w-2/5 rounded-t-lg bg-teal-500 transition hover:bg-teal-600" style={{ height: `${(item.first / max) * 100}%` }}>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-teal-700">{formatNumber(item.first)}</span>
              </div>
              <div className="relative w-2/5 rounded-t-lg bg-cyan-400 transition hover:bg-cyan-500" style={{ height: `${(item.second / max) * 100}%` }}>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan-700">{formatNumber(item.second)}</span>
              </div>
            </div>
            <span className="pb-2 text-xs font-semibold text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBars({
  data,
  color = palette.blue,
  suffix = "",
}: {
  data: { label: string; value: number; meta?: string }[];
  color?: string;
  suffix?: string;
}) {
  const max = Math.max(...data.map((item) => item.value));
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
            <span className="truncate font-semibold text-slate-700">{item.label}</span>
            <span className="shrink-0 font-bold text-slate-900">{formatNumber(item.value, Number.isInteger(item.value) ? 0 : 1)}{suffix}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }} />
          </div>
          {item.meta ? <p className="mt-1 text-[11px] text-slate-400">{item.meta}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = data.map((item) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(", ");

  return (
    <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-center">
      <div className="relative size-44 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-3xl font-semibold text-slate-950">{total}</span>
          <span className="text-xs text-slate-500">clientes</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex min-w-40 items-center justify-between gap-8 text-sm">
            <span className="flex items-center gap-2 text-slate-600"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
            <span className="font-bold text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
