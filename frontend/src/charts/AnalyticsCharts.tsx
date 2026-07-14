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
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: '#4B5563', // gray-600
        font: { family: 'Inter', weight: 'bold' as const }
      }
    }
  },
  scales: {
    x: {
      grid: { color: '#F3F4F6' }, // gray-100
      ticks: { color: '#6B7280' } // gray-500
    },
    y: {
      grid: { color: '#F3F4F6' },
      ticks: { color: '#6B7280', stepSize: 1 }
    }
  }
};

export function LineChart({ data }: { data: { date: string; count: number }[] }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Clicks',
        data: data.map(d => d.count),
        borderColor: 'rgb(234, 179, 8)', // yellow-500
        backgroundColor: 'rgba(254, 240, 138, 0.4)', // yellow-200 / 40%
        tension: 0.35,
        fill: true,
      }
    ]
  };

  return <Line data={chartData} options={chartOptions} />;
}

export function DoughnutChart({ data, title }: { data: { name: string; value: number }[]; title: string }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: title,
        data: data.map(d => d.value),
        backgroundColor: [
          'rgba(250, 204, 21, 0.85)',  // Primary Yellow
          'rgba(245, 158, 11, 0.85)',  // Amber
          'rgba(202, 138, 4, 0.85)',   // Darker Gold
          'rgba(107, 114, 128, 0.8)',  // Gray-500
          'rgba(209, 213, 219, 0.8)',  // Gray-300
        ],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      }
    ]
  };

  return (
    <div className="max-w-[280px] mx-auto">
      <Doughnut data={chartData} options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#4B5563', font: { family: 'Inter', weight: 'bold' as const } }
          }
        }
      }} />
    </div>
  );
}

export function BarChart({ data, label }: { data: { name: string; value: number }[]; label: string }) {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label,
        data: data.map(d => d.value),
        backgroundColor: 'rgba(250, 204, 21, 0.85)', // Primary Yellow
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1.5,
        borderRadius: 8,
      }
    ]
  };

  return <Bar data={chartData} options={chartOptions} />;
}
