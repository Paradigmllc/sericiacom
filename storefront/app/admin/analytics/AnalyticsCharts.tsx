"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type OrdersPoint = { date: string; orders: number };
type RevenuePoint = { date: string; revenue: number };
type WaitlistPoint = { date: string; signups: number };
type CountryPoint = { name: string; value: number };
type DropPoint = { name: string; orders: number; revenue: number };

type Props = {
  ordersSeries: OrdersPoint[];
  revenueSeries: RevenuePoint[];
  waitlistSeries: WaitlistPoint[];
  countrySeries: CountryPoint[];
  topDropsSeries: DropPoint[];
};

const INK = "#1a1915";
const ACCENT = "#8a7f5e";
const MUTE = "#b9b3a3";
const LINE = "#d9d4c2";
const SOFT = "#6d6858";
const PIE_COLORS = [INK, ACCENT, SOFT, "#a79464", "#5d5a4c", "#c4b78a", MUTE, LINE];

const axisStyle = { fontSize: 11, fill: SOFT };
const tooltipStyle = {
  backgroundColor: "#f5f1e6",
  border: `1px solid ${LINE}`,
  borderRadius: 0,
  fontSize: 12,
  color: INK,
};

export default function AnalyticsCharts({
  ordersSeries,
  revenueSeries,
  waitlistSeries,
  countrySeries,
  topDropsSeries,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Orders per day">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={ordersSeries} margin={{ top: 12, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} stroke={LINE} />
            <YAxis tick={axisStyle} stroke={LINE} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: MUTE }} />
            <Line
              type="monotone"
              dataKey="orders"
              stroke={INK}
              strokeWidth={1.5}
              dot={{ r: 2, fill: INK }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue per day (USD)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revenueSeries} margin={{ top: 12, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} stroke={LINE} />
            <YAxis tick={axisStyle} stroke={LINE} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: MUTE }}
              formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={ACCENT}
              strokeWidth={1.5}
              dot={{ r: 2, fill: ACCENT }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Waitlist signups per day">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={waitlistSeries} margin={{ top: 12, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} stroke={LINE} />
            <YAxis tick={axisStyle} stroke={LINE} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: MUTE }} />
            <Line
              type="monotone"
              dataKey="signups"
              stroke={SOFT}
              strokeWidth={1.5}
              dot={{ r: 2, fill: SOFT }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Orders by country">
        {countrySeries.length === 0 ? (
          <EmptyChart label="No orders yet" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={countrySeries}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                stroke="#f5f1e6"
              >
                {countrySeries.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: SOFT }} iconType="square" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Top drops (revenue)" className="lg:col-span-2">
        {topDropsSeries.length === 0 ? (
          <EmptyChart label="No drops with orders yet" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topDropsSeries}
              margin={{ top: 12, right: 16, bottom: 12, left: -8 }}
              barCategoryGap={16}
            >
              <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                stroke={LINE}
                interval={0}
                angle={-10}
                textAnchor="end"
                height={48}
              />
              <YAxis tick={axisStyle} stroke={LINE} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(185,179,163,0.15)" }}
                formatter={(v: number, name) =>
                  name === "revenue" ? [`$${v.toLocaleString()}`, "Revenue"] : [v, "Orders"]
                }
              />
              <Legend wrapperStyle={{ fontSize: 12, color: SOFT }} iconType="square" />
              <Bar dataKey="revenue" fill={INK} />
              <Bar dataKey="orders" fill={ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-sericia-line bg-sericia-paper-card p-6 ${className}`}>
      <h3 className="label mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-sericia-ink-mute text-[13px]">{label}</div>
  );
}
