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
  serverTimestamp,
  setDoc,
  increment,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "@/useAuth";

type Mood = "excited" | "happy" | "neutral" | "unhappy" | "regret";

type Transaction = {
  id: string;
  userId: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  mood: Mood;
};

type BudgetData = {
  totalBudget: number;
  remainingBudget: number;
};

type BudgetContextType = {
  transactions: Transaction[];
  addTransaction: (
    transaction: Omit<Transaction, "id" | "userId">
  ) => Promise<void>;
  totalBudget: number;
  setTotalBudget: (amount: number) => Promise<void>;
  remainingBudget: number;
  addToSavings: () => Promise<void>;
  savings: number;
  isLoading: boolean;
  updateTransaction: (
    id: string,
    transaction: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string, amount: number) => Promise<void>;
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
  const [totalBudget, setTotalBudget] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [savings, setSavings] = useState(0);
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
          const data = budgetDoc.docs[0].data() as BudgetData;
          setTotalBudget(data.totalBudget || 0);
          setRemainingBudget(data.remainingBudget || 0);
        } else {
          await addDoc(budgetRef, {
            totalBudget: 0,
            remainingBudget: 0,
          });
          setTotalBudget(0);
          setRemainingBudget(0);
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

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setSavings(userData.savings || 0);
        } else {
          setSavings(0);
        }
      } catch (error) {
        console.error("Error fetching budget data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "userId">
  ) => {
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

    const docRef = await addDoc(
      collection(db, "transactions"),
      transactionWithUser
    );
    const newTransaction: Transaction = {
      ...transactionWithUser,
      id: docRef.id,
    };
    setTransactions((prevTransactions) => [
      newTransaction,
      ...prevTransactions,
    ]);

    const newRemainingBudget = remainingBudget - transaction.amount;
    await updateBudget({ remainingBudget: newRemainingBudget });
    setRemainingBudget(newRemainingBudget);
  };

  const updateTransaction = async (
    id: string,
    updatedFields: Partial<Transaction>
  ) => {
    if (!user?.uid) {
      throw new Error("User must be logged in to update transactions");
    }

    try {
      const transactionRef = doc(db, "transactions", id);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        throw new Error("Transaction not found");
      }

      const oldTransaction = transactionDoc.data() as Transaction;
      const amountDifference =
        (updatedFields.amount || oldTransaction.amount) - oldTransaction.amount;

      if (amountDifference > remainingBudget) {
        alert("New transaction amount exceeds remaining budget!");
        return;
      }

      await updateDoc(transactionRef, {
        ...updatedFields,
        updatedAt: serverTimestamp(),
      });

      const newRemainingBudget = remainingBudget - amountDifference;
      await updateBudget({ remainingBudget: newRemainingBudget });
      setRemainingBudget(newRemainingBudget);

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t))
      );
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction. Please try again.");
    }
  };

  const deleteTransaction = async (id: string, amount: number) => {
    if (!user?.uid) {
      throw new Error("User must be logged in to delete transactions");
    }

    try {
      const transactionRef = doc(db, "transactions", id);
      await deleteDoc(transactionRef);

      const newRemainingBudget = remainingBudget + amount;
      await updateBudget({ remainingBudget: newRemainingBudget });
      setRemainingBudget(newRemainingBudget);

      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const updateBudget = async (budgetData: Partial<BudgetData>) => {
    if (!user?.uid) {
      throw new Error("User must be logged in to update budget");
    }

    const budgetRef = collection(db, "users", user.uid, "budget");
    const budgetDocs = await getDocs(budgetRef);

    if (budgetDocs.empty) {
      await addDoc(budgetRef, {
        ...budgetData,
        updatedAt: serverTimestamp(),
      });
      if (budgetData.totalBudget !== undefined)
        setTotalBudget(budgetData.totalBudget);
      if (budgetData.remainingBudget !== undefined)
        setRemainingBudget(budgetData.remainingBudget);
    } else {
      const budgetDoc = budgetDocs.docs[0];
      await updateDoc(doc(budgetRef, budgetDoc.id), {
        ...budgetData,
        updatedAt: serverTimestamp(),
      });
      if (budgetData.totalBudget !== undefined)
        setTotalBudget(budgetData.totalBudget);
      if (budgetData.remainingBudget !== undefined)
        setRemainingBudget(budgetData.remainingBudget);
    }
  };

  const setTotalBudgetAmount = async (amount: number) => {
    try {
      await updateBudget({ totalBudget: amount, remainingBudget: amount });
      setTotalBudget(amount);
      setRemainingBudget(amount);
    } catch (error) {
      console.error("Error setting total budget:", error);
      alert("Failed to update total budget. Please try again.");
    }
  };

  const addToSavings = async () => {
    if (!user?.uid) {
      throw new Error("User must be logged in to add to savings");
    }

    try {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        title: "Transfer to Savings",
        description: "Remaining budget transferred to savings",
        amount: remainingBudget,
        date: new Date().toISOString(),
        mood: "neutral",
      });

      await updateBudget({ remainingBudget: 0 });
      const currentRemainingBudget = remainingBudget;
      setRemainingBudget(0);

      const savingsRef = doc(db, "users", user.uid);
      await setDoc(
        savingsRef,
        {
          savings: increment(currentRemainingBudget),
        },
        { merge: true }
      );

      setSavings((prevSavings) => prevSavings + currentRemainingBudget);

      alert("Remaining budget added to savings!");
    } catch (error) {
      console.error("Error adding to savings:", error);
      alert("Failed to add to savings. Please try again.");
    }
  };

  return (
    <BudgetContext.Provider
      value={{
        transactions,
        addTransaction,
        totalBudget,
        setTotalBudget: setTotalBudgetAmount,
        remainingBudget,
        addToSavings,
        savings,
        isLoading,
        updateTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};
