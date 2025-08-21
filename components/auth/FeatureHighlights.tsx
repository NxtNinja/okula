import React from "react";
import { Brain, MessageSquare, Target, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Personalized education paths with advanced AI",
  },
  {
    icon: MessageSquare,
    title: "Interactive Conversations",
    description: "Engage with AI tutors for better understanding",
  },
  {
    icon: Target,
    title: "Goal-Oriented",
    description: "Track progress and achieve learning milestones",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Get immediate responses and corrections",
  },
];

const FeatureHighlights = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 rounded-lg bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-white/30 dark:border-gray-700/30"
          >
            <div className="flex-shrink-0">
              <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {feature.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {feature.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeatureHighlights;
