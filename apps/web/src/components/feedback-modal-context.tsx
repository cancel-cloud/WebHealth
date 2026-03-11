"use client";

import { createContext, useContext } from "react";
import type { FeedbackSource, FeedbackType } from "@/lib/feedback";

type FeedbackModalState = {
  open: boolean;
  source: FeedbackSource;
  initialType: FeedbackType | "";
};

type FeedbackModalContextValue = {
  openFeedback: (input: { source: FeedbackSource; initialType?: FeedbackType | "" }) => void;
};

const FeedbackModalContext = createContext<FeedbackModalContextValue | null>(null);

export function getFeedbackModalInitialState(): FeedbackModalState {
  return {
    open: false,
    source: "sidebar",
    initialType: "",
  };
}

export function getFeedbackModalNextState(input: {
  source: FeedbackSource;
  initialType?: FeedbackType | "";
}): FeedbackModalState {
  return {
    open: true,
    source: input.source,
    initialType: input.initialType ?? "",
  };
}

export function FeedbackModalProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: FeedbackModalContextValue;
}) {
  return <FeedbackModalContext.Provider value={value}>{children}</FeedbackModalContext.Provider>;
}

export function useFeedbackModal() {
  const value = useContext(FeedbackModalContext);
  if (!value) {
    throw new Error("useFeedbackModal must be used within FeedbackModalProvider");
  }
  return value;
}
