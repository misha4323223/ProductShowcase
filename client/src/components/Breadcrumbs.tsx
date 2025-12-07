import { Link } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="breadcrumb" className="py-3">
      <ol className="flex items-center gap-1 text-sm flex-wrap">
        <li className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm text-primary font-semibold hover:bg-white dark:hover:bg-black/70 transition-all shadow-sm hover:shadow-md"
            data-testid="breadcrumb-home"
          >
            <Home className="w-4 h-4" />
            <span>Главная</span>
          </Link>
        </li>
        
        <li className="flex items-center">
          <ChevronRight className="w-5 h-5 text-white drop-shadow-lg mx-1" />
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.url} className="flex items-center">
              {isLast ? (
                <span 
                  className="px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm text-white font-semibold shadow-md"
                  data-testid={`breadcrumb-current`}
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <>
                  <Link 
                    href={item.url} 
                    className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm text-primary font-semibold hover:bg-white dark:hover:bg-black/70 transition-all shadow-sm hover:shadow-md"
                    data-testid={`breadcrumb-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                  <ChevronRight className="w-5 h-5 text-white drop-shadow-lg mx-1" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
