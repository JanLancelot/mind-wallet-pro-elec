"use client";

import { useState } from "react";
import { useBudget } from "./BudgetContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PartyPopper, Heart, Circle, CloudRain, Cloud } from "lucide-react";

type Mood = "rad" | "good" | "meh" | "bad" | "awful";

const moodIcons: Record<Mood, React.ReactNode> = {
  rad: <PartyPopper className="w-6 h-6 text-green-500" />,
  good: <Heart className="w-6 h-6 text-blue-500" />,
  meh: <Circle className="w-6 h-6 text-yellow-500" />,
  bad: <Cloud className="w-6 h-6 text-orange-500" />,
  awful: <CloudRain className="w-6 h-6 text-red-500" />,
};

const moodLabels: Record<Mood, string> = {
  rad: "Excited",
  good: "Happy",
  meh: "Neutral",
  bad: "Unhappy",
  awful: "Regret",
};

export function TransactionForm() {
  const { addTransaction, remainingBudget } = useBudget();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [mood, setMood] = useState<Mood>("meh");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (numAmount > remainingBudget) {
      alert("Transaction amount exceeds remaining budget!");
      return;
    }
    await addTransaction({
      title,
      description,
      amount: numAmount,
      date: new Date().toISOString(),
      mood,
    });
    setTitle("");
    setDescription("");
    setAmount("");
    setMood("meh");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <Label>How do you feel about this expense?</Label>
            <RadioGroup 
              value={mood} 
              onValueChange={(value) => setMood(value as Mood)} 
              className="flex justify-between mt-2"
            >
              {(Object.keys(moodIcons) as Mood[]).map((moodKey) => (
                <div key={moodKey} className="flex flex-col items-center">
                  <RadioGroupItem value={moodKey} id={moodKey} className="sr-only" />
                  <Label
                    htmlFor={moodKey}
                    className={`cursor-pointer p-3 rounded-lg transition-all duration-200 ${
                      mood === moodKey 
                        ? "bg-primary/20 ring-2 ring-primary ring-offset-2 scale-110" 
                        : "hover:bg-primary/10"
                    }`}
                  >
                    {moodIcons[moodKey]}
                  </Label>
                  <span className="text-xs mt-2 font-medium">
                    {moodLabels[moodKey]}
                  </span>
                </div>
              ))}
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full">Add Transaction</Button>
        </form>
      </CardContent>
    </Card>
  );
}