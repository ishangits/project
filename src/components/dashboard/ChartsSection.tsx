// components/dashboard/ChartsSection.tsx
import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

interface DateWiseToken {
  date: string;
  tokens: number;
}

interface UsageByDomain {
  tokens: number;
  cost: number;
  requests: number;
  domain: { name: string };
}

interface ChartsSectionProps {
  dateWiseTokens: DateWiseToken[];
  usageByDomain: UsageByDomain[];
}

const safeFormatDate = (date: string | null | undefined, formatStr: string) => {
  if (!date) return 'N/A';
  try {
    const parsed = parseISO(date);
    if (isNaN(parsed.getTime())) return 'N/A';
    return format(parsed, formatStr);
  } catch {
    return 'N/A';
  }
};

const ChartsSection: React.FC<ChartsSectionProps> = ({
  dateWiseTokens,
  usageByDomain
}) => {
  const lineChartData = {
    labels: dateWiseTokens.map(item => safeFormatDate(item.date, 'MMM dd')),
    datasets: [
      {
        data: dateWiseTokens.map(item => item.tokens),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: usageByDomain.map(item => item?.domain || 'Unknown'),
    datasets: [
      {
        data: usageByDomain.map(item => item.tokens),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Token Usage Trend (30 Days)
        </h3>
        <div className="h-64">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Usage by Domain
        </h3>
        <div className="h-64 flex items-center justify-center">
          {usageByDomain.length > 0 ? (
            <Doughnut data={doughnutData} options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
            />
          ) : (
            <p className="text-gray-500">No usage data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;