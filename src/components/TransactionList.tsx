"use client";

import { useState } from "react";
import { useBudget } from "./BudgetContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  PartyPopper,
  Heart,
  Circle,
  Cloud,
  CloudRain,
  SlidersHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ExpenseMoodGraph from "./ExpenseMoodGraph";
import TransactionAnalysis from "./TransactionAnalysis";

const moodIcons: Record<string, React.ReactNode> = {
  rad: <PartyPopper className="w-5 h-5 text-green-500" />,
  good: <Heart className="w-5 h-5 text-blue-500" />,
  meh: <Circle className="w-5 h-5 text-yellow-500" />,
  bad: <Cloud className="w-5 h-5 text-orange-500" />,
  awful: <CloudRain className="w-5 h-5 text-red-500" />,
};

const moodLabels: Record<string, string> = {
  rad: "Excited",
  good: "Happy",
  meh: "Neutral",
  bad: "Unhappy",
  awful: "Regret",
};

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-7 bg-gray-200 animate-pulse rounded-md w-40" />
          <div className="flex items-center gap-2">
            <div className="h-10 bg-gray-200 animate-pulse rounded-md w-[200px] md:w-[300px]" />
            <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-md" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="h-5 bg-gray-200 animate-pulse rounded-md w-32" />
          <div className="h-5 bg-gray-200 animate-pulse rounded-md w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Mood</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-4 bg-gray-200 animate-pulse rounded-md w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 animate-pulse rounded-md w-32" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 bg-gray-200 animate-pulse rounded-md w-48" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-6 bg-gray-200 animate-pulse rounded-md w-20 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 bg-gray-200 animate-pulse rounded-md w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function TransactionList() {
  const { transactions, isLoading } = useBudget();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesSearch =
        transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesMood =
        selectedMoods.length === 0 || selectedMoods.includes(transaction.mood);
      return matchesSearch && matchesMood;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const totalAmount = filteredTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[200px] md:w-[300px]"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {Object.entries(moodLabels).map(([mood, label]) => (
                    <DropdownMenuCheckboxItem
                      key={mood}
                      checked={selectedMoods.includes(mood)}
                      onCheckedChange={(checked) => {
                        setSelectedMoods(
                          checked
                            ? [...selectedMoods, mood]
                            : selectedMoods.filter((m) => m !== mood)
                        );
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {moodIcons[mood]}
                        {label}
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-muted-foreground">
              {filteredTransactions.length} transactions found
            </div>
            <div className="text-sm font-medium">
              Total: ${totalAmount.toFixed(2)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium"
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                    >
                      Date {sortOrder === "asc" ? "↑" : "↓"}
                    </Button>
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Mood</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          transaction.amount > 100 ? "destructive" : "secondary"
                        }
                      >
                        ${transaction.amount.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {moodIcons[transaction.mood]}
                        <span className="hidden md:inline text-sm text-muted-foreground">
                          {moodLabels[transaction.mood]}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <ExpenseMoodGraph transactions={filteredTransactions} />
      <TransactionAnalysis transactions={filteredTransactions} />
    </div>
  );
}
