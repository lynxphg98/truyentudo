import React from 'react';

const ApiDashboardModal: React.FC = () => {
    return (
        <div>
            <h1>API Key Management</h1>

            <input type="text" placeholder="Enter your API key" />
            <button>Save API Key</button>
            <button>Delete API Key</button>
        </div>
    );
};

export default ApiDashboardModal;
