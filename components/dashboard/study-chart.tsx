"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { weeklyStudy } from "@/data/mock";

export function StudyChart() {
  return (
    <div className="chart-box" aria-label="Haftalık çalışma grafiği">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={weeklyStudy} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#F2F4F7" }} formatter={(value: number | string) => [`${value} dk`, "Çalışma"]} />
          <Bar dataKey="minutes" fill="#16A8B0" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
