import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';

const BusinessAnalyticsChart = ({ monthlyStats }) => {
  const formatMonth = (month) => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  };

  const chartData = monthlyStats.map(stat => ({
    ...stat,
    monthLabel: formatMonth(stat.month)
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={70}
                type="category"
                axisLine={true}
                tickLine={true}
              />
              <YAxis 
                type="number"
                orientation="left"
                axisLine={true}
                tickLine={true}
              />
              <Tooltip 
                labelFormatter={(label) => `Month: ${label}`}
                formatter={(value) => [value, 'Orders']}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={70}
                type="category"
                axisLine={true}
                tickLine={true}
              />
              <YAxis 
                type="number"
                orientation="left"
                axisLine={true}
                tickLine={true}
              />
              <Tooltip 
                labelFormatter={(label) => `Month: ${label}`}
                formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessAnalyticsChart;