import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
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
import { useNotification } from "./NotificationContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  addToSavings: (amount: number) => Promise<void>;
  transferFromSavings: (amount: number) => Promise<void>;
    addToBudget: (amount: number) => Promise<void>;
  savings: number;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  updateTransaction: (
    id: string,
    transaction: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string, amount: number) => Promise<void>;
};

type UserData = {
  savings: number;
  lastBudgetReset?: string;
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
  const { addNotification } = useNotification();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [savings, setSavings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetLoaded, setBudgetLoaded] = useState(false);

  const checkAndResetMonthlyBudget = async () => {
    if (!user?.uid || !budgetLoaded) return;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.data() as UserData;

    const lastReset = userData.lastBudgetReset
      ? new Date(userData.lastBudgetReset)
      : new Date(0);
    const now = new Date();

    if (
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear()
    ) {
      if (remainingBudget > 0) {
        await addToSavings(remainingBudget);
      }

      await updateBudget({
        totalBudget: 0,
        remainingBudget: 0,
      });
      setTotalBudget(0);
      setRemainingBudget(0);

      await setDoc(
        userDocRef,
        {
          lastBudgetReset: now.toISOString(),
        },
        { merge: true }
      );

      addNotification(
        "Your monthly budget has been reset and remaining funds were transferred to savings.",
      );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const budgetRef = collection(db, "users", user?.uid, "budget");
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
        setBudgetLoaded(true);
      } catch (error) {
        console.error("Error fetching budget data:", error);
        toast.error("Failed to fetch budget data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  useEffect(() => {
    checkAndResetMonthlyBudget();
  }, [budgetLoaded, user?.uid]);

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "userId">
  ) => {
    setIsLoading(true);
    if (!user?.uid) {
      throw new Error("User must be logged in to add transactions");
    }

    if (transaction.amount > remainingBudget) {
      toast.warn("Transaction amount exceeds remaining budget!");
      setIsLoading(false);
      return;
    }

    const transactionWithUser = {
      ...transaction,
      userId: user.uid,
    };

    try {
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
      toast.success("Transaction added successfully!");
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (
    id: string,
    updatedFields: Partial<Transaction>
  ) => {
    setIsLoading(true);
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
        toast.warn("New transaction amount exceeds remaining budget!");
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
      toast.success("Transaction updated successfully!");
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id: string, amount: number) => {
    setIsLoading(true);
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
      toast.success("Transaction deleted successfully!");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateBudget = async (budgetData: Partial<BudgetData>) => {
    setIsLoading(true);
    if (!user?.uid) {
      throw new Error("User must be logged in to update budget");
    }

    const budgetRef = collection(db, "users", user.uid, "budget");
    const budgetDocs = await getDocs(budgetRef);

    try {
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
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const setTotalBudgetAmount = async (amount: number) => {
    setIsLoading(true);
    try {
      await updateBudget({ totalBudget: amount, remainingBudget: amount });
      setTotalBudget(amount);
      setRemainingBudget(amount);
      toast.success("Total budget updated successfully!");
    } catch (error) {
      console.error("Error setting total budget:", error);
      toast.error("Failed to update total budget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

    const addToBudget = async (amount: number) => {
    setIsLoading(true);
    if (!user?.uid) {
      throw new Error("User must be logged in to add to budget");
    }

    if (amount <= 0) {
      toast.warn("Please enter a valid amount to add to budget.");
      setIsLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        title: "Add to Budget",
        description: "Funds added to budget",
        amount: amount,
        date: new Date().toISOString(),
        mood: "neutral",
      });

        const newTotalBudget = totalBudget + amount;
        const newRemainingBudget = remainingBudget + amount;
        await updateBudget({ totalBudget: newTotalBudget, remainingBudget: newRemainingBudget });
        setTotalBudget(newTotalBudget);
        setRemainingBudget(newRemainingBudget);


      toast.success("Funds added to budget!");
    } catch (error) {
      console.error("Error adding to budget:", error);
      toast.error("Failed to add to budget. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const addToSavings = async (amount: number) => {
    setIsLoading(true);
    if (!user?.uid) {
      throw new Error("User must be logged in to add to savings");
    }

    if (amount <= 0) {
      toast.warn("Please enter a valid amount to transfer.");
      setIsLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        title: "Transfer to Savings",
        description: "Budget transferred to savings",
        amount: amount,
        date: new Date().toISOString(),
        mood: "neutral",
      });

      const newRemainingBudget = remainingBudget - amount;
      await updateBudget({ remainingBudget: newRemainingBudget });
      setRemainingBudget(newRemainingBudget);

      const savingsRef = doc(db, "users", user.uid);
      await setDoc(
        savingsRef,
        {
          savings: increment(amount),
        },
        { merge: true }
      );

      setSavings((prevSavings) => prevSavings + amount);

      toast.success("Budget added to savings!");
    } catch (error) {
      console.error("Error adding to savings:", error);
      toast.error("Failed to add to savings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const transferFromSavings = async (amount: number) => {
    setIsLoading(true);
    if (!user?.uid) {
      throw new Error("User must be logged in to transfer from savings");
    }
    if (amount <= 0) {
      toast.warn("Please enter a valid amount to transfer.");
      setIsLoading(false);
      return;
    }
    if (amount > savings) {
      toast.warn("Transfer amount exceeds savings!");
      setIsLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        title: "Transfer from Savings",
        description: "Funds transferred from savings to budget",
        amount: amount,
        date: new Date().toISOString(),
        mood: "neutral",
      });

      const newRemainingBudget = remainingBudget + amount;
      await updateBudget({
        totalBudget: totalBudget + amount,
        remainingBudget: newRemainingBudget,
      });
      setTotalBudget((prevTotal) => prevTotal + amount);
      setRemainingBudget(newRemainingBudget);

      const savingsRef = doc(db, "users", user.uid);
      await setDoc(
        savingsRef,
        {
          savings: increment(-amount),
        },
        { merge: true }
      );

      setSavings((prevSavings) => prevSavings - amount);

      toast.success("Funds transferred from savings to budget!");
    } catch (error) {
      console.error("Error transferring from savings:", error);
      toast.error("Failed to transfer from savings. Please try again.");
    } finally {
      setIsLoading(false);
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
        transferFromSavings,
        savings,
        isLoading,
        setIsLoading,
        updateTransaction,
        deleteTransaction,
         addToBudget,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};