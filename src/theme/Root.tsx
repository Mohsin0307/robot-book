import React from 'react';
import ChatbotWidget from '@site/src/components/ChatbotWidget';

// Default implementation, that you can customize
export default function Root({children}) {
  return (
    <>
      {children}
      <ChatbotWidget />
    </>
  );
}
