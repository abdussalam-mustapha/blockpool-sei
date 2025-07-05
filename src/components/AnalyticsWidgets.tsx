
import { Card } from '@/components/ui/card';

const widgets = [
  {
    title: 'Token Inflow/Outflow',
    value: '$1.2M',
    change: '+15.3%',
    trend: 'up'
  },
  {
    title: 'Active Wallets',
    value: '8,492',
    change: '+8.7%',
    trend: 'up'
  },
  {
    title: 'NFTs Minted Today',
    value: '247',
    change: '-2.1%',
    trend: 'down'
  },
  {
    title: 'Top Token Volume',
    value: 'SEIYAN',
    change: '+45.2%',
    trend: 'up'
  },
  {
    title: 'Risky Contracts',
    value: '3',
    change: '-50%',
    trend: 'down'
  },
  {
    title: 'Swap Volume',
    value: '$892K',
    change: '+22.4%',
    trend: 'up'
  }
];

const AnalyticsWidgets = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {widgets.map((widget, index) => (
        <Card
          key={index}
          className="glass-card p-6 hover:border-primary/30 transition-all duration-300 hover:glow-green cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-400">{widget.title}</h4>
            <div className={`text-xs px-2 py-1 rounded-full ${
              widget.trend === 'up' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {widget.change}
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white mb-1">
            {widget.value}
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className={`h-1 rounded-full ${
                widget.trend === 'up' ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.random() * 100}%` }}
            ></div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsWidgets;
