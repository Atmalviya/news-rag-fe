import React from 'react';

export const FormattedMessage = ({ content, role }) => {
  const formatContent = (text) => {
    const sections = text.split('\n\n');
    
    return sections.map((section, index) => {
      if (section.startsWith('* ')) {
        const [heading, ...contentParts] = section.split('\n');
        const content = contentParts.join('\n').trim();
        
        return (
          <div key={index} className="mb-4">
            <h3 className="font-bold text-lg mb-2 text-gray-900">
              {heading.replace('* ', '')}
            </h3>
            <div className="pl-4">
              {content.split('\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-2 text-gray-700">{paragraph}</p>
              ))}
            </div>
          </div>
        );
      }
      
      return (
        <div key={index} className="mb-2">
          {section.split('\n').map((paragraph, pIndex) => (
            <p key={pIndex} className="mb-2 text-gray-700">{paragraph}</p>
          ))}
        </div>
      );
    });
  };

  return (
    <div
      className={`inline-block p-4 rounded-2xl max-w-[80%] ${
        role === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-white text-gray-900 shadow-sm border'
      }`}
    >
      {role === 'assistant' ? (
        <div className="prose prose-sm max-w-none">
          {formatContent(content)}
        </div>
      ) : (
        content
      )}
    </div>
  );
}; 