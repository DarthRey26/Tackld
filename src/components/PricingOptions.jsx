import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, Zap } from 'lucide-react';

const PricingOptions = ({ onSelect }) => {
  const options = [
    {
      type: 'Economic',
      description: 'Budget-friendly option with flexible schedule',
      icon: Clock,
      features: ['Basic service', 'Flexible timing', 'Standard tools']
    },
    {
      type: 'Standard',
      description: 'Average pricing with regular schedule',
      icon: Star,
      features: ['Regular service', 'Fixed schedule', 'Quality tools']
    },
    {
      type: 'Premium',
      description: 'Premium service with priority scheduling',
      icon: Zap,
      features: ['Premium service', 'Priority scheduling', 'Professional tools']
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <Card key={option.type} className="hover:shadow-lg transition-shadow border-2">
            <CardHeader className={`${option.type === 'Premium' ? 'bg-blue-50' : ''}`}>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Icon className={`h-6 w-6 ${option.type === 'Premium' ? 'text-blue-500' : 'text-gray-600'}`} />
                {option.type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-gray-600 mb-4">{option.description}</p>
              <ul className="space-y-3 mb-4">
                {option.features.map((feature, index) => (
                  <li key={index} className="text-base flex items-center gap-2">
                    <span className={`h-2 w-2 ${option.type === 'Premium' ? 'bg-blue-500' : 'bg-gray-400'} rounded-full`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => onSelect(option.type)} 
                className={`w-full text-lg py-6 ${
                  option.type === 'Premium' 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                Select {option.type}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PricingOptions;