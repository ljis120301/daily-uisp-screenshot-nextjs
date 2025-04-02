'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent, 
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval, parseISO } from "date-fns";

interface DeviceData {
  timestamp: string;
  onlineDevices: number;
  screenshotPath: string;
}

const chartConfig = {
  devices: {
    label: "Online Devices",
    color: "hsl(var(--chart-1))",
  }
} satisfies ChartConfig;

export function DevicesChart() {
  const [data, setData] = useState<DeviceData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/devices-data');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching devices data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter and format the data for the chart based on date range
  const chartData = data
    .filter(item => {
      if (!dateRange?.from || !dateRange?.to) return true;
      const itemDate = parseISO(item.timestamp);
      return isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to });
    })
    .map(item => ({
      date: format(parseISO(item.timestamp), 'MMM d, HH:mm'),
      devices: item.onlineDevices
    }));

  // Calculate Y-axis domain
  const deviceValues = chartData.map(item => item.devices);
  const minDevices = Math.min(...deviceValues);
  const maxDevices = Math.max(...deviceValues);
  const padding = 5; // Add some padding to the min and max values
  const yAxisDomain = [minDevices - padding, maxDevices + padding];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Device History</h1>
            <p className="text-sm text-muted-foreground">
                Please first select your start date, then select your end date.
            </p>
        </div>
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          className="rounded-md border"
        />
      </div>
      <ChartContainer config={chartConfig} className="h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] w-full">
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 80, left: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            domain={yAxisDomain}
            tickCount={6}
            tickFormatter={(value) => value.toString()}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar 
            dataKey="devices" 
            fill="hsl(var(--chart-1))" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
} 