import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

const steps = [
  { key: 'account', label: 'Account Details', number: 1 },
  { key: 'skills', label: 'Select Skills', number: 2 },
];

export default function FormStepper({ currentStep, completedSteps = [] }) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);
  const isCompleted = (key) => completedSteps.includes(key);

  return (
    <div className="mb-8" role="navigation" aria-label="Registration progress">
      <ol className="flex items-center" aria-label="Registration steps">
        {steps.map((step, index) => (
          <li key={step.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isCompleted(step.key) || index < currentIndex
                  ? 'bg-primary-600 text-white'
                  : index === currentIndex
                  ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}>
                {isCompleted(step.key) || index < currentIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`hidden sm:block text-sm font-medium ${
                isCompleted(step.key) || index <= currentIndex
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 transition-colors ${
                index < currentIndex ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </li>
        ))}
      </ol>
      <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={steps.length}>
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>Step {currentIndex + 1} of {steps.length}</span>
        <span>{Math.round(((currentIndex + 1) / steps.length) * 100)}% complete</span>
      </div>
    </div>
  );
}