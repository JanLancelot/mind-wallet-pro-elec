import Navbar from "@/components/Navbar";
import { BudgetProvider } from "@/components/BudgetContext";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { BudgetOverview } from "@/components/BudgetOverview";
import { ToastContainer } from 'react-toastify';

function Home() {
  return (
    <div>
      <Navbar />
      <BudgetProvider>
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BudgetOverview />
            <TransactionForm />
          </div>
          <TransactionList />
        </div>
        <ToastContainer />
      </BudgetProvider>
    </div>
  );
}

export default Home;