import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Brain,
  Target,
  AlertTriangle,
  ThumbsUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

interface AnalysisSection {
  title: string;
  content: string[];
  icon: keyof typeof sectionIcons;
  sentiment?: "positive" | "negative" | "neutral";
}

const sectionIcons = {
  patterns: Brain,
  emotions: Target,
  concerns: AlertTriangle,
  positives: ThumbsUp,
};

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY!);

const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({
  transactions,
}) => {
  const [parsedAnalysis, setParsedAnalysis] = useState<AnalysisSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const parseAnalysisIntoSections = useCallback(
    (text: string): AnalysisSection[] => {
      const sections: AnalysisSection[] = [];
      const lines = text.split("\n");
      let currentSection: AnalysisSection | null = null;

      lines.forEach((line) => {
        if (line.startsWith("# ")) {
          if (currentSection) {
            sections.push(currentSection);
          }
          const title = line.replace("# ", "");
          currentSection = {
            title,
            content: [],
            icon: getSectionIcon(title),
            sentiment: getSectionSentiment(title),
          };
        } else if (currentSection && line.trim()) {
          currentSection.content.push(line.trim());
        }
      });

      if (currentSection) {
        sections.push(currentSection);
      }

      return sections;
    },
    []
  );

  const getSectionIcon = (title: string): keyof typeof sectionIcons => {
    if (title.toLowerCase().includes("pattern")) return "patterns";
    if (title.toLowerCase().includes("emotion")) return "emotions";
    if (title.toLowerCase().includes("concern")) return "concerns";
    return "positives";
  };

  const getSectionSentiment = (
    title: string
  ): "positive" | "negative" | "neutral" => {
    if (title.toLowerCase().includes("concern")) return "negative";
    if (title.toLowerCase().includes("positive")) return "positive";
    return "neutral";
  };

  const generateAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!transactions.length) {
        setParsedAnalysis([]);
        return;
      }

      const analysisData = transactions.map((t) => ({
        date: new Date(t.date).toLocaleDateString(),
        amount: t.amount,
        title: t.title,
        mood: t.mood,
        description: t.description,
      }));

      const moodPatterns = transactions.reduce<Record<string, number>>(
        (acc, t) => {
          acc[t.mood] = (acc[t.mood] || 0) + t.amount;
          return acc;
        },
        {}
      );

      const prompt = `Analyze these transactions and provide insights in the following format:

      # Spending Patterns
      [List 3-4 key patterns with bullet points]

      # Emotional Spending Trends
      [Analyze mood-based spending with bullet points]

      # Areas of Concern
      [List specific concerns with bullet points]

      # Positive Habits
      [List positive behaviors to reinforce with bullet points]

      Transaction Data:
      ${JSON.stringify(analysisData)}

      Mood-based spending:
      ${JSON.stringify(moodPatterns)}

      Make each section concise and actionable.
      Note: Each transaction is made using the Philippine peso.
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = await response.text();

      setParsedAnalysis(parseAnalysisIntoSections(analysisText));
    } catch (err: unknown) {
      let errorMessage = "Unable to generate spending analysis. Please try again later.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      setError(errorMessage);
      console.error("Analysis generation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [transactions, parseAnalysisIntoSections]);

  const shouldShowUpTrend = (text: string): boolean => {
    const upwardIndicators = [
      "increase",
      "higher",
      "more",
      "significant spending",
      "high-value",
      "large purchases",
      "strong interest",
      "overspending",
      "lack of budgeting",
      "impulsive",
    ];

    return upwardIndicators.some((indicator) =>
      text.toLowerCase().includes(indicator.toLowerCase())
    );
  };

  const formatBulletPoint = useCallback((text: string): JSX.Element => {
    const parts = text.split(/(\*\*.*?\*\*)/).filter(Boolean);
    const isUpwardTrend = shouldShowUpTrend(text);

    return (
      <div className="flex items-start gap-3 mt-3">
        {isUpwardTrend ? (
          <TrendingUp className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
        ) : (
          <TrendingDown className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
        )}
        <p className="text-sm leading-relaxed">
          {parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <span key={index} className="font-bold">
                  {part.slice(2, -2)}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </p>
      </div>
    );
  }, []);

  const renderSection = useCallback((section: AnalysisSection) => {
    const Icon = sectionIcons[section.icon];
    const bgColor = {
      positive: "bg-green-50 dark:bg-green-950",
      negative: "bg-red-50 dark:bg-red-950",
      neutral: "bg-blue-50 dark:bg-blue-950",
    }[section.sentiment || "neutral"];

    return (
      <div key={section.title} className={`p-4 rounded-lg ${bgColor} mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">{section.title}</h3>
        </div>
        <div className="space-y-1">
          {section.content.map((point, index) => (
            <div key={index}>
              {formatBulletPoint(point.replace(/^\* /, ""))}
            </div>
          ))}
        </div>
      </div>
    );
  }, [formatBulletPoint]);

  useEffect(() => {
    generateAnalysis();
  }, [generateAnalysis]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending Analysis</CardTitle>
          <Button
            onClick={generateAnalysis}
            disabled={isLoading}
            variant="outline"
            className="ml-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Refresh Analysis"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <Progress value={30} className="w-full" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        )}

        {!isLoading && parsedAnalysis.length > 0 && (
          <div className="space-y-4">{parsedAnalysis.map(renderSection)}</div>
        )}

        {!isLoading && !error && parsedAnalysis.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {transactions.length === 0
              ? "No transactions to analyze."
              : "No analysis available for the provided transactions."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionAnalysis;