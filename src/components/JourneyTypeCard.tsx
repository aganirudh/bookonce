import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyTypeCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
  selected: boolean;
  onClick: () => void;
  gradient: string;
}

const JourneyTypeCard = ({
  icon,
  title,
  description,
  features,
  selected,
  onClick,
  gradient,
}: JourneyTypeCardProps) => {
  return (
    <Card
      className={cn(
        'relative p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
        selected
          ? 'ring-2 ring-primary shadow-xl'
          : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
    >
      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-4 right-4 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Icon with Gradient */}
      <div
        className={cn(
          'inline-flex p-3 rounded-lg bg-gradient-to-br mb-4',
          gradient,
          'text-primary-foreground'
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{description}</p>

      {/* Features */}
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Hover Effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg bg-gradient-to-br opacity-0 transition-opacity duration-300',
          gradient,
          selected ? 'opacity-5' : 'hover:opacity-5'
        )}
      />
    </Card>
  );
};

export default JourneyTypeCard;
