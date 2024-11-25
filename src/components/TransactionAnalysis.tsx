import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from '@/components/ui/button';

interface Transaction {
  date: string;
  amount: number;
  title: string;
  mood: string;
  description: string;
}

interface TransactionAnalysisProps {
  transactions: Transaction[];
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY!);

const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({ transactions }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const generateAnalysis = async () => {
    setIsLoading(true);
    setError('');

    try {
      const analysisData = transactions.map((t) => ({
        date: new Date(t.date).toLocaleDateString(),
        amount: t.amount,
        title: t.title,
        mood: t.mood,
        description: t.description,
      }));

      const moodPatterns = transactions.reduce<Record<string, number>>((acc, t) => {
        acc[t.mood] = (acc[t.mood] || 0) + t.amount;
        return acc;
      }, {});

      const prompt = `As a financial advisor, analyze these transactions and provide personalized recommendations. Focus on:
      1. Overall spending patterns
      2. Emotional spending trends (based on mood data)
      3. Specific recommendations for improvement
      4. Areas of concern and positive habits

      Transaction Data:
      ${JSON.stringify(analysisData)}

      Mood-based spending patterns:
      ${JSON.stringify(moodPatterns)}

      Provide a concise, actionable analysis with specific recommendations based on both the spending amounts and the associated moods.`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
      const result = await model.generateContent(prompt);
      const response = await result.response;

      setAnalysis(await response.text());
    } catch (err) {
      setError('Unable to generate spending analysis. Please try again later.');
      console.error('Analysis generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string): JSX.Element[] => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const formatAnalysis = (text: string): JSX.Element[] => {
    if (!text) return [];

    return text.split('\n').map((line, index) => {
      if (line.startsWith('#')) {
        return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">
          {formatText(line.replace(/^#+ /, ''))}
        </h3>;
      }

      if (line.trim().startsWith('*')) {
        return (
          <div key={index} className="flex items-start gap-2 mt-2">
            <div className="mt-1">
              {line.includes('increase') || line.includes('high') ? 
                <TrendingUp className="w-4 h-4 text-red-500" /> :
                <TrendingDown className="w-4 h-4 text-green-500" />
              }
            </div>
            <p className="text-sm">{formatText(line.replace('* ', ''))}</p>
          </div>
        );
      }

      return <p key={index} className="mt-2 text-sm text-muted-foreground">
        {formatText(line)}
      </p>;
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending Analysis</CardTitle>
          <Button
            onClick={generateAnalysis}
            disabled={isLoading}
            className="ml-4"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Spending'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {analysis ? (
            <div className="prose prose-sm max-w-none">
              {formatAnalysis(analysis)}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Click "Analyze Spending" to get personalized insights about your spending habits.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionAnalysis;