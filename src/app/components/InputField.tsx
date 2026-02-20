import { useState, forwardRef } from 'react';
import { motion } from 'motion/react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  onEnter?: () => void;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ error = false, onEnter, className = "", ...props }, ref) => {
    const [shake, setShake] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onEnter) {
        onEnter();
      }
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    const triggerShake = () => {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    };

    // Trigger shake when error becomes true
    if (error && !shake) {
      triggerShake();
    }

    return (
      <motion.div
        animate={shake ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <input
          ref={ref}
          {...props}
          onKeyDown={handleKeyDown}
          className={`
            w-full bg-transparent text-center
            text-[var(--nm-text-high)] font-[family-name:var(--font-data)]
            border-0 border-b-2 
            ${error 
              ? 'border-b-[var(--nm-accent-error)]' 
              : 'border-b-transparent focus:border-b-[var(--nm-accent-primary)]'
            }
            outline-none px-4 py-2
            transition-colors duration-250
            placeholder:text-[var(--nm-text-annotation)]
            ${className}
          `}
        />
      </motion.div>
    );
  }
);

InputField.displayName = 'InputField';
