
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

const routes = [
  { href: '/', label: 'nav.home' },
  { href: '/mentors', label: 'nav.mentors' },
  { href: '/about', label: 'nav.about' },
  // { href: '/resources', label: 'Resources' },
];

const MainNav = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  return (
    <div className="border-b">
      <div className="container-wide flex h-16 items-center justify-between">
        <Link to="/" className="font-bold text-2xl text-primary flex items-center gap-2">
          {/* <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-sm">SH</span>
          </div> */}
          Scholar Hub 
        </Link>
        
        {isMobile ? (
          <MobileNav />
        ) : (
          <div className="flex items-center space-x-4">
            <NavigationMenu>
              <NavigationMenuList>
                {routes.map((route) => (
                  <NavigationMenuItem key={route.href}>
                    <Link to={route.href}>
                      <NavigationMenuLink className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                      )}>
                        {route.label.startsWith('nav.') ? t(route.label) : route.label}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="flex items-center space-x-2">
              {/* <LanguageSwitcher /> */}
              <Link to="/login">
                <Button variant="outline">{t('nav.login')}</Button>
              </Link>
              <Link to="/signup">
                <Button>{t('nav.signup')}</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileNav = () => {
  const { t } = useLanguage();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col gap-6 pt-10">
          <Link to="/" className="font-bold text-2xl text-primary flex items-center gap-2">
            {/* <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-sm">SH</span>
            </div> */}
            Scholar Hub 
          </Link>
          <nav className="flex flex-col gap-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                to={route.href}
                className="text-lg font-medium hover:text-primary transition"
              >
                {route.label.startsWith('nav.') ? t(route.label) : route.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-4">
            
            <Link to="/login">
              <Button variant="outline" className="w-full">{t('nav.login')}</Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full">{t('nav.signup')}</Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MainNav;
