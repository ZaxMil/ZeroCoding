import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeSelector from '@/components/ThemeSelector';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Home, Book, Settings, Search, User } from 'lucide-react';

export const Header = () => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold">Manga Reader</span>
          </Link>

          <nav className="flex items-center space-x-4 ml-auto">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            
            <Button variant="ghost" asChild>
              <Link to="/library" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                Library
              </Link>
            </Button>
            
            <Button variant="ghost" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
            
            <Button variant="ghost" asChild>
              <Link to="/admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            </Button>
            
            <ThemeSelector />
          </nav>
        </div>
      </header>

      <GlobalSearch 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)} 
      />
    </>
  );
};