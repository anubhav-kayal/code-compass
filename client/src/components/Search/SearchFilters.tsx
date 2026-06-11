interface SearchFiltersProps {
  searchType: "code" | "file" | "symbol";
  onTypeChange: (type: "code" | "file" | "symbol") => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
}

const searchTypes = [
  { value: "code" as const, label: "Code" },
  { value: "file" as const, label: "Files" },
  { value: "symbol" as const, label: "Symbols" },
];

export function SearchFilters({ searchType, onTypeChange }: SearchFiltersProps) {
  return (
    <div className="flex gap-2">
      {searchTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchType === type.value
              ? "bg-primary-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-gray-200"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
