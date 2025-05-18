import React, { useState, useEffect } from 'react';
import { FormattedMessage } from './FormattedMessage';

export const StreamingMessage = ({ content, role, onComplete }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!content) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(prev => prev + content[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 20); // Adjust speed as needed

    return () => clearInterval(interval);
  }, [content, onComplete]);

  return (
    <FormattedMessage 
      content={displayedContent} 
      role={role}
    />
  );
}; 