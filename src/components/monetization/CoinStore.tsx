import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Star, Zap, Crown } from 'lucide-react';
import { CoinPackage } from '@/types/monetization';
import { usePayPal } from '@/hooks/usePayPal';
import { cn } from '@/lib/utils';

interface CoinStoreProps {
  onPurchaseSuccess?: (coins: number) => void;
}

const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 100,
    price: 0.99,
    bonus_coins: 0,
    popular: false,
    description: 'Perfect for trying premium content'
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    coins: 500,
    price: 4.99,
    bonus_coins: 50,
    popular: true,
    description: 'Best value for regular readers'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    coins: 1200,
    price: 9.99,
    bonus_coins: 200,
    popular: false,
    description: 'For the ultimate reading experience'
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    coins: 2500,
    price: 19.99,
    bonus_coins: 500,
    popular: false,
    description: 'Maximum coins for serious collectors'
  }
];

export const CoinStore: React.FC<CoinStoreProps> = ({ onPurchaseSuccess }) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { createPayment, loading } = usePayPal();

  const handlePurchase = async (pkg: CoinPackage) => {
    setSelectedPackage(pkg.id);
    
    try {
      const success = await createPayment({
        amount: pkg.price,
        currency: 'USD',
        description: `${pkg.name} - ${pkg.coins + pkg.bonus_coins} coins`,
        coinPackageId: pkg.id
      });

      if (success) {
        onPurchaseSuccess?.(pkg.coins + pkg.bonus_coins);
      }
    } finally {
      setSelectedPackage(null);
    }
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter': return <Coins className="h-6 w-6" />;
      case 'popular': return <Star className="h-6 w-6" />;
      case 'premium': return <Zap className="h-6 w-6" />;
      case 'ultimate': return <Crown className="h-6 w-6" />;
      default: return <Coins className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Coin Store</h2>
        <p className="text-muted-foreground">
          Purchase coins to unlock premium chapters and exclusive content
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COIN_PACKAGES.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={cn(
              "relative transition-all duration-200 hover:shadow-lg",
              pkg.popular && "ring-2 ring-primary"
            )}
          >
            {pkg.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10">
                {getPackageIcon(pkg.id)}
              </div>
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div className="space-y-1">
                <div className="text-3xl font-bold">${pkg.price}</div>
                <div className="text-sm text-muted-foreground">
                  {pkg.coins} coins
                  {pkg.bonus_coins > 0 && (
                    <span className="text-green-600 font-medium">
                      {' '}+ {pkg.bonus_coins} bonus
                    </span>
                  )}
                </div>
                <div className="text-lg font-semibold text-primary">
                  Total: {pkg.coins + pkg.bonus_coins} coins
                </div>
              </div>
              
              <Button
                onClick={() => handlePurchase(pkg)}
                disabled={loading || selectedPackage === pkg.id}
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
              >
                {selectedPackage === pkg.id ? 'Processing...' : 'Purchase'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Secure payments powered by PayPal</p>
        <p>Coins are non-refundable and have no cash value</p>
      </div>
    </div>
  );
};