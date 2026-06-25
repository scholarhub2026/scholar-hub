
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SearchProps {
  onSearch: (query: string) => void;
}

const MentorSearch: React.FC<SearchProps> = ({ onSearch }) => {
  const [query, setQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch} className="relative mb-6">
      <div className="flex w-full max-w-lg items-center">
        <Input
          type="search"
          placeholder="Search by name, subject, or expertise..."
          className="flex-1 h-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" className="ml-2 h-12 px-6">
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
      </div>
    </form>
  );
};

export default MentorSearch;
