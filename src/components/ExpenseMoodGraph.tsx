import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PartyPopper, Heart, Circle, Cloud, CloudRain } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type MoodType = 'rad' | 'good' | 'meh' | 'bad' | 'awful';

interface Transaction {
  id: string;
  date: string;
  title: string;
  description: string;
  amount: number;
  mood: MoodType;
}

interface ChartDataPoint {
  date: string;
  amount: number;
  transactions: Transaction[];
  moodScore: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  label?: string;
}

interface ExpenseMoodGraphProps {
  transactions: Transaction[];
}

const moodIcons: Record<MoodType, JSX.Element> = {
  rad: <PartyPopper className="w-4 h-4 text-green-500" />,
  good: <Heart className="w-4 h-4 text-blue-500" />,
  meh: <Circle className="w-4 h-4 text-yellow-500" />,
  bad: <Cloud className="w-4 h-4 text-orange-500" />,
  awful: <CloudRain className="w-4 h-4 text-red-500" />
};

const moodScores: Record<MoodType, number> = {
  rad: 5,
  good: 4,
  meh: 3,
  bad: 2,
  awful: 1
};

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const avgMoodScore = data.moodScore;
  const dominantMood = Object.entries(moodScores)
    .reduce((closest, [mood, score]) => {
      return Math.abs(score - avgMoodScore) < Math.abs(score - closest.score)
        ? { mood: mood as MoodType, score }
        : closest;
    }, { mood: 'meh' as MoodType, score: 3 }).mood;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border">
      <p className="font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">
        Total Spent: ${data.amount.toFixed(2)}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span>Average Mood:</span>
        {moodIcons[dominantMood]}
      </div>
    </div>
  );
};

const ExpenseMoodGraph: React.FC<ExpenseMoodGraphProps> = ({ transactions }) => {
  const chartData = useMemo(() => {
    const grouped = transactions.reduce<Record<string, ChartDataPoint>>((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          amount: 0,
          transactions: [],
          moodScore: 0
        };
      }
      acc[date].amount += transaction.amount;
      acc[date].transactions.push(transaction);
      acc[date].moodScore = acc[date].transactions.reduce(
        (sum, t) => sum + moodScores[t.mood], 0
      ) / acc[date].transactions.length;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [transactions]);

  const averageSpending = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.amount, 0) / chartData.length;
  }, [chartData]);

  interface DotProps {
    cx: number;
    cy: number;
    payload: ChartDataPoint;
    value: number;
    index: number;
  }

  const renderCustomDot = (props: DotProps) => {
    const { cx, cy, payload } = props;
    const avgMoodScore = payload.moodScore;
    const dominantMood = Object.entries(moodScores)
      .reduce((closest, [mood, score]) => {
        return Math.abs(score - avgMoodScore) < Math.abs(score - closest.score)
          ? { mood: mood as MoodType, score }
          : closest;
      }, { mood: 'meh' as MoodType, score: 3 }).mood;

    return (
      <g transform={`translate(${cx - 8},${cy - 8})`}>
        {React.cloneElement(moodIcons[dominantMood], {
          className: `w-4 h-4 ${moodIcons[dominantMood].props.className}`
        })}
      </g>
    );
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Spending & Mood Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(date: string) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={averageSpending}
                stroke="#888888"
                strokeDasharray="3 3"
                label={{ value: "Avg Spending", position: "right" }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
                strokeWidth={2}
                dot={renderCustomDot}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseMoodGraph;