import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">About Budgee</h1>
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-gray-700 leading-relaxed">
            Welcome to Budgee, your personal companion in navigating the world of
            finances! We aim to provide you with simple, yet powerful tools to
            keep track of your expenses, manage your budget, and achieve your
            financial goals.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Our mission is to make financial management accessible to everyone,
            regardless of their expertise. Whether you're saving up for a big
            purchase, paying off debt, or just curious about where your money is
            going, Budgee is here to help.
          </p>
          <h2 className="text-xl font-semibold mt-4 mb-2">Key Features</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>
              <strong>Expense Tracking:</strong> Easily log your daily expenses
              and see where your money is going.
            </li>
            <li>
              <strong>Budget Creation:</strong> Set monthly budgets and track your
              progress to stay within your limits.
            </li>
            <li>
              <strong>User-Friendly Interface:</strong> A clean and intuitive
              design makes it easy to get started and stay organized.
            </li>
            <li>
              <strong>Data Visualization:</strong> See your spending habits at a
              glance with simple charts and graphs.
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            We are constantly working to improve Budgee and add new features
            that will benefit our users. Your feedback is important to us, so
            please don't hesitate to reach out with any questions, suggestions,
            or comments.
          </p>
        </div>
      </div>
    </div>
  );
}