import React, { useEffect, useRef } from 'react';

export const AutoResizeTextarea = ({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "38px",
  ...props
}) => {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} overflow-hidden resize-none block w-full no-print focus-ring`}
        rows={1}
        style={{ minHeight: minHeight }}
        {...props}
      />
      <div className="hidden print-only whitespace-pre-wrap text-sm leading-tight p-2 text-start">
        {value || ' '}
      </div>
    </>
  );
};
