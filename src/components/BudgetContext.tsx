import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { useAuth } from "@/useAuth";

type Transaction = {
  id: string;
  userId: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  mood: "rad" | "good" | "meh" | "bad" | "awful";
};

type BudgetContextType = {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "userId">) => Promise<void>;
  budget: number;
  setBudget: (amount: number) => Promise<void>;
  remainingBudget: number;
  isLoading: boolean;
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const budgetRef = collection(db, "users", user.uid, "budget");
        const budgetDoc = await getDocs(budgetRef);
        if (!budgetDoc.empty) {
          setBudget(budgetDoc.docs[0].data().amount);
        }

        const q = query(
          collection(db, "transactions"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedTransactions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(fetchedTransactions);
      } catch (error) {
        console.error("Error fetching budget data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  useEffect(() => {
    const totalExpenses = transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    setRemainingBudget(budget - totalExpenses);
  }, [transactions, budget]);

  const addTransaction = async (transaction: Omit<Transaction, "id" | "userId">) => {
    if (!user?.uid) {
      throw new Error("User must be logged in to add transactions");
    }

    if (transaction.amount > remainingBudget) {
      alert("Transaction amount exceeds remaining budget!");
      return;
    }

    const transactionWithUser = {
      ...transaction,
      userId: user.uid,
    };

    const docRef = await addDoc(collection(db, "transactions"), transactionWithUser);
    const newTransaction: Transaction = { ...transactionWithUser, id: docRef.id };
    setTransactions((prevTransactions) => [
      newTransaction,
      ...prevTransactions,
    ]);
  };

  const updateBudget = async (amount: number) => {
    if (!user?.uid) {
      throw new Error("User must be logged in to update budget");
    }

    const budgetRef = collection(db, "users", user.uid, "budget");
    const budgetDocs = await getDocs(budgetRef);
    
    if (budgetDocs.empty) {
      await addDoc(budgetRef, { amount });
    } else {
      const budgetDoc = budgetDocs.docs[0];
      await updateDoc(doc(budgetRef, budgetDoc.id), { amount });
    }
    setBudget(amount);
  };

  return (
    <BudgetContext.Provider
      value={{
        transactions,
        addTransaction,
        budget,
        setBudget: updateBudget,
        remainingBudget,
        isLoading,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};