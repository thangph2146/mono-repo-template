"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import type {
  DashboardMonthlyItemDto,
  DashboardCategoryItemDto,
  DashboardTopPostDto,
} from "@/types/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const MONTH_LABELS: Record<string, string> = {
  "01": "Th1", "02": "Th2", "03": "Th3", "04": "Th4",
  "05": "Th5", "06": "Th6", "07": "Th7", "08": "Th8",
  "09": "Th9", "10": "Th10", "11": "Th11", "12": "Th12",
};

function formatMonth(key: string): string {
  const parts = key.split("-");
  const mm = parts[1] ?? "";
  return MONTH_LABELS[mm] ?? key;
}

const CHART_COLORS = {
  blue:   { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.9)" },
  violet: { bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.9)" },
  rose:   { bg: "rgba(244,63,94,0.15)",   border: "rgba(244,63,94,0.9)" },
  amber:  { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.9)" },
  teal:   { bg: "rgba(20,184,166,0.15)",  border: "rgba(20,184,166,0.9)" },
  slate:  { bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.9)" },
};

const DOUGHNUT_COLORS = [
  "rgba(59,130,246,0.85)",
  "rgba(139,92,246,0.85)",
  "rgba(244,63,94,0.85)",
  "rgba(245,158,11,0.85)",
  "rgba(20,184,166,0.85)",
  "rgba(100,116,139,0.85)",
  "rgba(251,146,60,0.85)",
  "rgba(52,211,153,0.85)",
];

const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: "index" as const, intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "rgba(100,116,139,0.8)", font: { size: 11 } },
    },
    y: {
      grid: { color: "rgba(100,116,139,0.08)" },
      ticks: { color: "rgba(100,116,139,0.8)", font: { size: 11 } },
      beginAtZero: true,
    },
  },
};

export function MonthlyLineChart({ data }: { data: DashboardMonthlyItemDto[] }) {
  const labels = data.map((d) => formatMonth(d.month));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Bài viết",
        data: data.map((d) => d.posts),
        borderColor: CHART_COLORS.blue.border,
        backgroundColor: CHART_COLORS.blue.bg,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: "Tài khoản",
        data: data.map((d) => d.users),
        borderColor: CHART_COLORS.violet.border,
        backgroundColor: CHART_COLORS.violet.bg,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: "Liên hệ",
        data: data.map((d) => d.contactRequests),
        borderColor: CHART_COLORS.rose.border,
        backgroundColor: CHART_COLORS.rose.bg,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Hoạt động theo tháng (12 tháng gần nhất)</CardTitle>
        <div className="flex flex-wrap gap-3 pt-1">
          {chartData.datasets.map((ds) => (
            <span key={ds.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block size-2.5 rounded-full" style={{ background: ds.borderColor }} />
              {ds.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line
            data={chartData}
            options={{
              ...BASE_OPTIONS,
              plugins: {
                ...BASE_OPTIONS.plugins,
                legend: { display: false },
                tooltip: { mode: "index", intersect: false },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function MonthlyBarChart({ data }: { data: DashboardMonthlyItemDto[] }) {
  const labels = data.map((d) => formatMonth(d.month));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Bài viết",
        data: data.map((d) => d.posts),
        backgroundColor: CHART_COLORS.blue.border,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: "Tài khoản mới",
        data: data.map((d) => d.users),
        backgroundColor: CHART_COLORS.violet.border,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: "Liên hệ",
        data: data.map((d) => d.contactRequests),
        backgroundColor: CHART_COLORS.rose.border,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Bài viết & Tài khoản theo tháng</CardTitle>
        <div className="flex flex-wrap gap-3 pt-1">
          {chartData.datasets.map((ds) => (
            <span key={ds.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block size-2.5 rounded-full" style={{ background: ds.backgroundColor as string }} />
              {ds.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={chartData} options={BASE_OPTIONS} />
        </div>
      </CardContent>
    </Card>
  );
}

function flattenCategories(items: DashboardCategoryItemDto[]): { name: string; count: number }[] {
  const result: { name: string; count: number }[] = [];
  for (const item of items) {
    if (item.count > 0) {
      result.push({ name: item.name, count: item.count });
    }
    if (item.children?.length) {
      result.push(...flattenCategories(item.children));
    }
  }
  return result.sort((a, b) => b.count - a.count).slice(0, 8);
}

export function CategoryDoughnutChart({ data }: { data: DashboardCategoryItemDto[] }) {
  const flat = flattenCategories(data);

  if (!flat.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Phân bố bài viết theo danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu danh mục.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels: flat.map((d) => d.name),
    datasets: [
      {
        data: flat.map((d) => d.count),
        backgroundColor: DOUGHNUT_COLORS,
        borderWidth: 2,
        borderColor: "transparent",
        hoverBorderColor: "rgba(255,255,255,0.6)",
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Phân bố bài viết theo danh mục</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="mx-auto h-52 w-52 shrink-0">
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "62%",
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.label}: ${ctx.parsed} bài`,
                    },
                  },
                },
              }}
            />
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {flat.map((item, i) => (
              <li key={item.name} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ background: DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopPostsChart({ data }: { data: DashboardTopPostDto[] }) {
  if (!data.length) return null;

  const top = data.slice(0, 8);
  const chartData = {
    labels: top.map((p) => p.title.length > 30 ? p.title.slice(0, 30) + "…" : p.title),
    datasets: [
      {
        label: "Bình luận",
        data: top.map((p) => p.comments),
        backgroundColor: CHART_COLORS.teal.border,
        borderRadius: 4,
        barPercentage: 0.65,
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Top bài viết nhiều bình luận nhất</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar
            data={chartData}
            options={{
              ...BASE_OPTIONS,
              indexAxis: "y" as const,
              scales: {
                x: {
                  grid: { color: "rgba(100,116,139,0.08)" },
                  ticks: { color: "rgba(100,116,139,0.8)", font: { size: 11 } },
                  beginAtZero: true,
                },
                y: {
                  grid: { display: false },
                  ticks: { color: "rgba(100,116,139,0.8)", font: { size: 11 } },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
