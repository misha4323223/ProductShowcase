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
    <nav aria-label="breadcrumb" className="py-3 px-4 md:px-8">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <li className="flex items-center gap-2">
          <Link 
            href="/" 
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            data-testid="breadcrumb-home"
          >
            <Home className="w-4 h-4" />
            <span>Главная</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.url} className="flex items-center gap-2">
              {isLast ? (
                <span 
                  className="text-foreground font-medium"
                  data-testid={`breadcrumb-current`}
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <>
                  <Link 
                    href={item.url} 
                    className="hover:text-foreground transition-colors"
                    data-testid={`breadcrumb-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
