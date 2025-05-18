import React from 'react';

export const Sources = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 text-sm text-gray-500 max-w-[80%] mx-auto">
      <div className="font-medium mb-1">Sources:</div>
      {sources.map((source, idx) => (
        <a
          key={idx}
          href={source.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="font-medium">{source.title}</div>
          <div className="text-xs text-gray-400">{source.source}</div>
        </a>
      ))}
    </div>
  );
}; 