interface SearchFormProps {
  defaultValue?: string;
  size?: 'lg' | 'md';
  placeholder?: string;
}

export function SearchForm({
  defaultValue = '',
  size = 'lg',
  placeholder = 'Search plants, cultivars, nurseries...',
}: SearchFormProps) {
  const inputClass =
    size === 'lg' ? 'px-4 py-3 text-lg' : 'px-4 py-2.5';
  const btnClass =
    size === 'lg' ? 'px-6 py-3 text-lg' : 'px-5 py-2.5';

  return (
    <form action="/search" method="GET" className="flex gap-2" role="search">
      <label htmlFor="search-input" className="sr-only">
        Search
      </label>
      <input
        id="search-input"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`flex-1 rounded-lg border border-gray-300 ${inputClass} focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200`}
      />
      <button
        type="submit"
        className={`rounded-lg bg-green-700 ${btnClass} font-medium text-white hover:bg-green-800`}
      >
        Search
      </button>
    </form>
  );
}
