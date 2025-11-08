import { Truck, ShieldCheck, CreditCard, RotateCcw } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: 'Доставка по России',
    description: 'Курьерская доставка в любой город',
  },
  {
    icon: ShieldCheck,
    title: 'Гарантия качества',
    description: 'Только свежая продукция',
  },
  {
    icon: CreditCard,
    title: 'Удобная оплата',
    description: 'Онлайн или при получении',
  },
  {
    icon: RotateCcw,
    title: 'Возврат 14 дней',
    description: 'Гарантия качества товара',
  },
];

export default function BenefitsBar() {
  return (
    <div className="bg-gradient-to-b from-pink-100/40 via-purple-50/30 to-background py-16 wavy-divider relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-300/20 rounded-full blur-2xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center gap-3 group hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-200/60 via-purple-200/50 to-blue-200/40 flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all group-hover:scale-125 duration-300 sugar-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full" />
                <benefit.icon className="h-8 w-8 text-primary relative z-10 group-hover:text-accent transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600" data-testid={`text-benefit-title-${index}`}>
                  {benefit.title}
                </h3>
                <p className="text-xs text-muted-foreground" data-testid={`text-benefit-desc-${index}`}>
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
