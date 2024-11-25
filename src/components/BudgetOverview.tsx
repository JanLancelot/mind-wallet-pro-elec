import { useBudget } from "./BudgetContext"
import { useAuth } from "@/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Total Budget</p>
            <div className="h-8 bg-gray-200 animate-pulse rounded-md mt-1" />
          </div>
          <div>
            <p className="text-sm font-medium">Remaining Budget</p>
            <div className="h-8 bg-gray-200 animate-pulse rounded-md mt-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Set New Budget</Label>
          <div className="flex space-x-2">
            <div className="h-10 bg-gray-200 animate-pulse rounded-md flex-grow" />
            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetOverview() {
  const { user } = useAuth()
  const { budget, setBudget, remainingBudget, isLoading } = useBudget()
  const [newBudget, setNewBudget] = useState("")

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    const budgetAmount = parseFloat(newBudget)
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      alert("Please enter a valid budget amount")
      return
    }
    try {
      await setBudget(budgetAmount)
      setNewBudget("")
    } catch (err) {
      console.error("Budget update error:", err)
      alert("Failed to update budget. Please try again.")
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center">Please log in to view and manage your budget.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Total Budget</p>
            <p className="text-2xl font-bold">${budget.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Remaining Budget</p>
            <p className="text-2xl font-bold">${remainingBudget.toFixed(2)}</p>
          </div>
        </div>
        <form onSubmit={handleSetBudget} className="space-y-2">
          <Label htmlFor="newBudget">Set New Budget</Label>
          <div className="flex space-x-2">
            <Input
              id="newBudget"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              min="0.01"
              step="0.01"
              className="flex-grow"
            />
            <Button type="submit">Set Budget</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}