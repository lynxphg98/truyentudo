import React from 'react';
import Input from './components/Input';
import TextArea from './components/TextArea';

const App = () => {
  return (
    <div className="app-container">
      {/* Example usage of Input */}
      <Input placeholder="Enter text" className="dark-input high-contrast" />
      {/* Example usage of TextArea */}
      <TextArea placeholder="Enter more text" className="dark-textarea high-contrast" />
    </div>
  );
};

export default App;