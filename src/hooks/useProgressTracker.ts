import { useState, useCallback } from 'react';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  details?: string;
}

export const useProgressTracker = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const calculateEstimatedTime = useCallback((sentenceCount: number, stepId: string) => {
    // Realistic time estimates per sentence for different operations
    const timePerSentence = {
      'parsing': 0.1, // 0.1 seconds per sentence
      'analysis': 0.3, // 0.3 seconds per sentence for AI detection
      'plagiarism': 1.5, // 1.5 seconds per sentence for plagiarism
      'research': 2.0, // 2 seconds per sentence for deep research
      'finalizing': 0.1 // 0.1 seconds per sentence
    };

    const baseTime = timePerSentence[stepId as keyof typeof timePerSentence] || 1.0;
    return Math.ceil(sentenceCount * baseTime);
  }, []);

  const initializeProgress = useCallback((stepDefinitions: Omit<ProgressStep, 'status' | 'progress'>[], textLength?: string) => {
    const initialSteps = stepDefinitions.map(step => ({
      ...step,
      status: 'pending' as const,
      progress: 0
    }));
    
    setSteps(initialSteps);
    setIsVisible(true);
    setCurrentStep(initialSteps[0]?.id || '');
    setOverallProgress(0);
    setStartTime(Date.now());
    
    // Calculate initial time estimate based on text length
    if (textLength) {
      const sentenceCount = Math.max(1, textLength.split(/[.!?]+/).filter(s => s.trim().length > 10).length);
      const totalEstimatedTime = stepDefinitions.reduce((total, step) => {
        return total + calculateEstimatedTime(sentenceCount, step.id);
      }, 0);
      setEstimatedTimeRemaining(totalEstimatedTime);
    }
  }, [calculateEstimatedTime]);

  const updateStepProgress = useCallback((stepId: string, progress: number, details?: string) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            status: progress >= 100 ? 'completed' : 'processing' as const,
            progress: Math.min(progress, 100),
            details
          };
        }
        return step;
      });

      // Calculate overall progress
      const totalProgress = newSteps.reduce((sum, step) => sum + step.progress, 0);
      const overall = totalProgress / newSteps.length;
      setOverallProgress(overall);

      // Update time remaining based on actual progress
      if (startTime && overall > 5) { // Only calculate after some progress
        const elapsed = (Date.now() - startTime) / 1000;
        const estimated = Math.max(0, Math.round((elapsed / overall) * (100 - overall)));
        setEstimatedTimeRemaining(estimated);
      }

      return newSteps;
    });
  }, [startTime]);

  const completeStep = useCallback((stepId: string) => {
    updateStepProgress(stepId, 100);
    
    setSteps(prevSteps => {
      const currentIndex = prevSteps.findIndex(step => step.id === stepId);
      const nextStep = prevSteps[currentIndex + 1];
      
      if (nextStep) {
        setCurrentStep(nextStep.id);
        // Start the next step
        setTimeout(() => {
          updateStepProgress(nextStep.id, 1, 'Starting...');
        }, 100);
      }
      
      return prevSteps;
    });
  }, [updateStepProgress]);

  const setStepError = useCallback((stepId: string, errorMessage: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, status: 'error' as const, details: errorMessage }
          : step
      )
    );
    setEstimatedTimeRemaining(null);
  }, []);

  const hideProgress = useCallback(() => {
    setIsVisible(false);
    setSteps([]);
    setCurrentStep('');
    setOverallProgress(0);
    setStartTime(null);
    setEstimatedTimeRemaining(null);
  }, []);

  return {
    isVisible,
    currentStep,
    steps,
    overallProgress,
    estimatedTimeRemaining,
    initializeProgress,
    updateStepProgress,
    completeStep,
    setStepError,
    hideProgress
  };
};