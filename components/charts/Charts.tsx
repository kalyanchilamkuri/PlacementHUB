'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS = { stroke: 'var(--chart-axis)', fontSize: 12, fontFamily: 'var(--font-sans)' };

function Card({
  title,
  note,
  children,
  legend,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  legend?: React.ReactNode;
}) {
  return (
    <figure className="rounded-2xl border border-line bg-surface p-5">
      <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {legend}
      </figcaption>
      {note && <p className="mb-4 text-sm text-muted">{note}</p>}
      {children}
    </figure>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span className="h-0.5 w-4 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

function TipShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-deep rounded-xl px-3 py-2 text-xs shadow-none">{children}</div>
  );
}

/* --------------------------------------------- branch-wise placement rate */

export function BranchPlacementChart({
  data,
}: {
  data: { branch: string; pct: number; placed: number; cohort: number }[];
}) {
  return (
    <Card title="Placed by branch" note="Share of each cohort holding at least one offer.">
      <ResponsiveContainer width="100%" height={Math.max(240, data.length * 34)}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 44, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis type="number" domain={[0, 100]} unit="%" {...AXIS} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="branch"
            width={56}
            {...AXIS}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--chart-grid)', opacity: 0.45 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]!.payload as (typeof data)[number];
              return (
                <TipShell>
                  <div className="font-medium">{d.branch}</div>
                  <div className="tnum mt-0.5 text-muted">
                    {d.placed} of {d.cohort} placed, {d.pct}%
                  </div>
                </TipShell>
              );
            }}
          />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={14} fill="var(--chart-1)">
            {data.map((d) => (
              <Cell key={d.branch} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* --------------------------------------------------------------- CTC trend */

export function CtcTrendChart({
  data,
}: {
  data: { season: string; average: number; median: number }[];
}) {
  const last = data[data.length - 1];
  return (
    <Card
      title="Package trend"
      note="Average and median annual package, in lakhs."
      legend={
        <span className="flex gap-4">
          <Swatch color="var(--chart-1)" label="Average" />
          <Swatch color="var(--chart-2)" label="Median" />
        </span>
      }
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: -14, right: 44, top: 12, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="season" {...AXIS} tickLine={false} axisLine={false} />
          <YAxis
            {...AXIS}
            tickLine={false}
            axisLine={false}
            width={48}
            unit="L"
            domain={[
              (min: number) => Math.max(0, Math.floor(min - 4)),
              (max: number) => Math.ceil(max + 3),
            ]}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <TipShell>
                  <div className="font-medium">Season {label}</div>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} className="tnum mt-0.5 flex gap-2 text-muted">
                      <span
                        className="mt-1.5 h-0.5 w-3 shrink-0 rounded-full"
                        style={{ background: p.color }}
                        aria-hidden
                      />
                      <span className="capitalize">{String(p.dataKey)}</span>
                      <span className="ml-auto">{p.value} LPA</span>
                    </div>
                  ))}
                </TipShell>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
          <Line
            type="monotone"
            dataKey="median"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
          />
        </LineChart>
      </ResponsiveContainer>
      {last && (
        <p className="tnum mt-2 text-xs text-muted">
          Latest season: {last.average} LPA average, {last.median} LPA median.
        </p>
      )}
    </Card>
  );
}

/* --------------------------------------------------------- CTC distribution */

export function CtcHistogram({ data }: { data: { label: string; count: number }[] }) {
  return (
    <Card title="Where the offers land" note="Number of offers in each package band, in lakhs.">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: -18, right: 8, top: 12, bottom: 4 }} barCategoryGap={10}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" {...AXIS} tickLine={false} axisLine={false} />
          <YAxis {...AXIS} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ fill: 'var(--chart-grid)', opacity: 0.45 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <TipShell>
                  <div className="font-medium">{label} LPA</div>
                  <div className="tnum mt-0.5 text-muted">{payload[0]!.value} offers</div>
                </TipShell>
              );
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--chart-1)" maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ------------------------------------------------------------- donut chart */

export function DonutChart({
  title,
  note,
  data,
  centre,
}: {
  title: string;
  note?: string;
  data: { name: string; value: number; color: string }[];
  centre?: { value: string; label: string };
}) {
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <Card title={title} note={note}>
      {total === 0 ? (
        <p className="py-16 text-center text-sm text-muted">No data for this selection yet.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="relative size-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 2 : 0}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  animationDuration={900}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]!;
                    return (
                      <TipShell>
                        <div className="font-medium">{String(d.name)}</div>
                        <div className="tnum mt-0.5 text-muted">
                          {String(d.value)} ({Math.round((Number(d.value) / total) * 100)}%)
                        </div>
                      </TipShell>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {centre && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="tnum display text-3xl">{centre.value}</div>
                  <div className="text-xs text-muted">{centre.label}</div>
                </div>
              </div>
            )}
          </div>
          <ul className="space-y-2 text-sm">
            {data.map((d) => (
              <li key={d.name} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: d.color }} aria-hidden />
                <span>{d.name}</span>
                <span className="tnum ml-2 text-muted">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------- company-wise selections */

export function CompanyBarChart({ data }: { data: { company: string; count: number }[] }) {
  return (
    <Card title="Top recruiters" note="Companies ranked by students selected.">
      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">No offers recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(240, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 28, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
            <XAxis type="number" allowDecimals={false} {...AXIS} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="company" width={110} {...AXIS} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--chart-grid)', opacity: 0.45 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]!.payload as (typeof data)[number];
                return (
                  <TipShell>
                    <div className="font-medium">{d.company}</div>
                    <div className="tnum mt-0.5 text-muted">{d.count} selected</div>
                  </TipShell>
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14} fill="var(--chart-2)" animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/* ------------------------------------------------- batch-wise stacked bars */

export function BatchStackChart({
  data,
  series,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
}) {
  return (
    <Card title="Batch by batch" note="Students in each batch, split by where they are now.">
      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">No offers recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ left: -14, right: 8, top: 12, bottom: 4 }} barCategoryGap={22}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="batch" {...AXIS} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} {...AXIS} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ fill: 'var(--chart-grid)', opacity: 0.45 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <TipShell>
                    <div className="font-medium">{String(label)}</div>
                    {payload.map((p) => (
                      <div key={String(p.dataKey)} className="tnum mt-0.5 flex gap-2 text-muted">
                        <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                        <span>{series.find((x) => x.key === p.dataKey)?.label}</span>
                        <span className="ml-auto">{String(p.value)}</span>
                      </div>
                    ))}
                  </TipShell>
                );
              }}
            />
            {series.map((x, i) => (
              <Bar
                key={x.key}
                dataKey={x.key}
                stackId="a"
                fill={x.color}
                radius={i === series.length - 1 ? [6, 6, 0, 0] : 0}
                maxBarSize={64}
                animationDuration={900}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="mt-3 flex flex-wrap gap-4">
        {series.map((x) => (
          <span key={x.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-2.5 rounded-full" style={{ background: x.color }} aria-hidden />
            {x.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
