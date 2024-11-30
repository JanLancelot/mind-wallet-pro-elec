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
  MoreVertical,
  Pencil,
  Trash,
  Search,
  PartyPopper,
  Heart,
  Circle,
  Cloud,
  CloudRain,
  SlidersHorizontal,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import ExpenseMoodGraph from "./ExpenseMoodGraph";
import TransactionAnalysis from "./TransactionAnalysis";
import { DatePickerDemo } from "./DatePicker";

type Mood = "excited" | "happy" | "neutral" | "unhappy" | "regret";

const moodIcons: Record<Mood, React.ReactNode> = {
  excited: <PartyPopper className="w-5 h-5 text-green-500" />,
  happy: <Heart className="w-5 h-5 text-blue-500" />,
  neutral: <Circle className="w-5 h-5 text-yellow-500" />,
  unhappy: <Cloud className="w-5 h-5 text-orange-500" />,
  regret: <CloudRain className="w-5 h-5 text-red-500" />,
};

const moodLabels: Record<Mood, string> = {
  excited: "Excited",
  happy: "Happy",
  neutral: "Neutral",
  unhappy: "Unhappy",
  regret: "Regret",
};

type EditTransactionData = {
  id: string;
  title: string;
  description: string;
  amount: number;
  mood: Mood;
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
  const { transactions, isLoading, updateTransaction, deleteTransaction } =
    useBudget();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<EditTransactionData | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<{
    id: string;
    amount: number;
  } | null>(null);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleEdit = (transaction: EditTransactionData) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string, amount: number) => {
    setDeletingTransaction({ id, amount });
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      await updateTransaction(editingTransaction.id, {
        title: editingTransaction.title,
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        mood: editingTransaction.mood,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction(
        deletingTransaction.id,
        deletingTransaction.amount
      );
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

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

      const transactionDate = new Date(transaction.date);
      const matchesDateRange =
        (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate);

      return matchesSearch && matchesMood && matchesDateRange;
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
          <div className="space-y-4">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex flex-col gap-4">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr,auto] gap-2 items-center">
                <div className="w-full">
                  <DatePickerDemo date={startDate} setDate={setStartDate} />
                </div>
                <span className="text-muted-foreground px-1">to</span>
                <div className="w-full">
                  <DatePickerDemo date={endDate} setDate={setEndDate} />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="ml-auto">
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
                          {moodIcons[mood as Mood]}
                          {label}
                        </span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredTransactions.length} transactions found
              </div>
              <div className="text-sm font-medium">
                Total: ₱{totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
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
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]">Mood</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {transaction.title}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm max-w-[300px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          transaction.amount > 1000
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs sm:text-sm"
                      >
                        ₱{transaction.amount.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {moodIcons[transaction.mood]}{" "}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleDelete(transaction.id, transaction.amount)
                            }
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Make changes to your transaction here. Click save when you're
              done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTransaction}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingTransaction?.title || ""}
                  onChange={(e) =>
                    setEditingTransaction((prev) =>
                      prev ? { ...prev, title: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editingTransaction?.description || ""}
                  onChange={(e) =>
                    setEditingTransaction((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={editingTransaction?.amount || 0}
                  onChange={(e) =>
                    setEditingTransaction((prev) =>
                      prev
                        ? { ...prev, amount: parseFloat(e.target.value) }
                        : null
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mood">Mood</Label>
                <Select
                  value={editingTransaction?.mood}
                  onValueChange={(value: Mood) =>
                    setEditingTransaction((prev) =>
                      prev ? { ...prev, mood: value } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(moodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value as Mood}>
                        <div className="flex items-center gap-2">
                          {moodIcons[value as Mood]}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExpenseMoodGraph transactions={filteredTransactions} />
      <TransactionAnalysis transactions={filteredTransactions} />
    </div>
  );
}
