import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, disabled = false, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
        <input
          type="range"
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%, rgb(30 41 59) ${((value - min) / (max - min)) * 100}%, rgb(30 41 59) 100%)`
          }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
