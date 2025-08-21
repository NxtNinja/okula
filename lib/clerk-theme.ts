import { dark } from "@clerk/themes";

export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#3b82f6",
    colorPrimaryText: "#ffffff",
    colorText: "#374151",
    colorTextSecondary: "#6b7280",
    colorBackground: "rgba(255, 255, 255, 0.8)",
    colorInputBackground: "rgba(255, 255, 255, 0.9)",
    colorInputText: "#374151",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    rootBox: "mx-auto",
    card: "shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton: 
      "bg-white/90 hover:bg-gray-50 dark:bg-gray-800/90 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-200",
    socialButtonsBlockButtonText: "text-gray-700 dark:text-gray-300 font-medium",
    formButtonPrimary: 
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl",
    formFieldInput: 
      "bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200",
    formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
    footerActionLink: "text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200",
    dividerLine: "bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent",
    dividerText: "text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 px-4",
    formFieldSuccessText: "text-green-600",
    formFieldErrorText: "text-red-600",
    identityPreviewText: "text-gray-600 dark:text-gray-400",
    identityPreviewEditButton: "text-blue-600 hover:text-blue-700",
  },
};

export const clerkDarkAppearance = {
  ...clerkAppearance,
  variables: {
    ...clerkAppearance.variables,
    colorText: "#f3f4f6",
    colorTextSecondary: "#9ca3af",
    colorBackground: "rgba(17, 24, 39, 0.8)",
    colorInputBackground: "rgba(17, 24, 39, 0.9)",
    colorInputText: "#f3f4f6",
  },
};
