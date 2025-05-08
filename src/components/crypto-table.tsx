import { useAppSelector } from "../store/hooks";
import { useState, useMemo, type FC } from "react";
import { selectAllAssets, selectAssetsStatus } from "../store/crypto-slice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import SparklineChart from "./sprakline-chart";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

// Sorting types
type SortField = 'price' | 'percentChange1h' | 'percentChange24h' | 'percentChange7d' | 'marketCap' | 'volume24h';
type SortDirection = 'asc' | 'desc';

// Filter types
type FilterOption = 'all' | 'gainers' | 'losers' | 'stablecoins';

// Utility functions
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 6,
  }).format(value);

const formatLargeNumber = (value: number): string => {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString();
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

const formatPercentage = (value: number): string => `${value.toFixed(2)}%`;

const renderPercentChange = (value: number) => {
  const isPositive = value >= 0;
  const colorClass = isPositive
    ? "text-[hsl(var(--chart-2))]"
    : "text-[hsl(var(--destructive))]";
  const Icon = isPositive ? ArrowUp : ArrowDown;

  return (
    <span className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {formatPercentage(value)}
    </span>
  );
};

// Sort icon component
const SortIcon = ({ 
  field, 
  currentField, 
  direction 
}: { 
  field: SortField; 
  currentField: SortField; 
  direction: SortDirection 
}) => {
  if (field !== currentField) {
    return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground/70" />;
  }
  
  return direction === 'asc' 
    ? <ArrowUp className="ml-1 h-4 w-4" />
    : <ArrowDown className="ml-1 h-4 w-4" />;
};

const CryptoTable: FC = () => {
  const assets = useAppSelector(selectAllAssets);
  const status = useAppSelector(selectAssetsStatus);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filtering state
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Apply filters and sorting
  const filteredAndSortedAssets = useMemo(() => {
    // First apply filters
    let result = [...assets];
    
    // Apply category filter
    switch (filterOption) {
      case 'gainers':
        result = result.filter(asset => asset.percentChange24h > 0);
        break;
      case 'losers':
        result = result.filter(asset => asset.percentChange24h < 0);
        break;
      case 'stablecoins':
        result = result.filter(asset => 
          asset.symbol.includes('USD') || 
          (asset.percentChange24h > -0.5 && asset.percentChange24h < 0.5)
        );
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        asset => 
          asset.name.toLowerCase().includes(query) || 
          asset.symbol.toLowerCase().includes(query)
      );
    }
    
    // Then sort
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      const compareResult = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
    
    return result;
  }, [assets, filterOption, searchQuery, sortField, sortDirection]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="rounded-lg border bg-white shadow-lg p-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 py-3 border-b last:border-b-0"
          >
            <Skeleton className="h-4 w-[30px]" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="text-red-500 text-center p-4">
        Failed to load crypto data.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={filterOption === 'all' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterOption('all')}
          >
            All
          </Badge>
          <Badge 
            variant={filterOption === 'gainers' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterOption('gainers')}
          >
            Top Gainers
          </Badge>
          <Badge 
            variant={filterOption === 'losers' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterOption('losers')}
          >
            Top Losers
          </Badge>
          <Badge 
            variant={filterOption === 'stablecoins' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterOption('stablecoins')}
          >
            Stablecoins
          </Badge>
        </div>
        
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search by name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>
      <div className="rounded-lg border bg-white text-black shadow-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center sticky left-0 bg-white z-30">
                #
              </TableHead>
              <TableHead className="w-[70px] sticky left-[50px] bg-white z-30">
                Logo
              </TableHead>
              <TableHead className="min-w-[150px] sticky left-[120px] bg-white z-30">
                Name
              </TableHead>
              <TableHead className="min-w-[80px] sticky left-[120px] bg-white z-30">
                Symbol
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                <div className="flex items-center">
                  Price
                  <SortIcon field="price" currentField={sortField} direction={sortDirection} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('percentChange1h')}>
                <div className="flex items-center">
                  1h %
                  <SortIcon field="percentChange1h" currentField={sortField} direction={sortDirection} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('percentChange24h')}>
                <div className="flex items-center">
                  24h %
                  <SortIcon field="percentChange24h" currentField={sortField} direction={sortDirection} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('percentChange7d')}>
                <div className="flex items-center">
                  7d %
                  <SortIcon field="percentChange7d" currentField={sortField} direction={sortDirection} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('marketCap')}>
                <div className="flex items-center">
                  Market Cap
                  <SortIcon field="marketCap" currentField={sortField} direction={sortDirection} />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('volume24h')}>
                <div className="flex items-center">
                  Volume (24h)
                  <SortIcon field="volume24h" currentField={sortField} direction={sortDirection} />
                </div>
              </TableHead>
              <TableHead>Circulating Supply</TableHead>
              <TableHead>Max Supply</TableHead>
              <TableHead className="min-w-[100px] text-right">7D Chart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAssets.map((asset, index) => (
              <TableRow
                key={asset.id}
                className="hover:bg-gray-100 transition-colors duration-150"
              >
                <TableCell className="text-center sticky left-0 bg-white z-20">
                  {index + 1}
                </TableCell>
                <TableCell className="sticky left-[50px] bg-white z-20">
                  <img
                    src={asset.logo}
                    alt={`${asset.name} logo`}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </TableCell>
                <TableCell className="sticky left-[120px] bg-white z-20 font-semibold">
                  {asset.name}
                </TableCell>
                <TableCell className="sticky left-[120px] bg-white z-20 text-gray-500">
                  {asset.symbol}
                </TableCell>
                <TableCell className="font-mono">
                  {formatCurrency(asset.price)}
                </TableCell>
                <TableCell className="font-mono">
                  {renderPercentChange(asset.percentChange1h)}
                </TableCell>
                <TableCell className="font-mono">
                  {renderPercentChange(asset.percentChange24h)}
                </TableCell>
                <TableCell className="font-mono">
                  {renderPercentChange(asset.percentChange7d)}
                </TableCell>
                <TableCell className="font-mono">
                  {formatLargeNumber(asset.marketCap)}
                </TableCell>
                <TableCell className="font-mono">
                  {formatLargeNumber(asset.volume24h)}
                </TableCell>
                <TableCell className="font-mono">
                  {formatNumber(asset.circulatingSupply)} {asset.symbol}
                </TableCell>
                <TableCell className="font-mono">
                  {asset.maxSupply
                    ? `${formatNumber(asset.maxSupply)} ${asset.symbol}`
                    : "∞"}
                </TableCell>
                <TableCell className="text-right">
                  <SparklineChart
                    data={asset.sparkline7d}
                    positive={asset.percentChange7d >= 0}
                    className="w-24 h-10"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CryptoTable;