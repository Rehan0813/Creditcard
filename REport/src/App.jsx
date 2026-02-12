import React from 'react';
import BankCard from './components/BankCard';
import './index.css';

const nationalBanks = [
  { name: "Download the Schema Template", color: "cyan", url: "#" },
  { name: "Prepare Your Transaction Data", color: "purple", url: "#" },
  { name: "Upload the CSV File", color: "orange", url: "#" },
  { name: "State Bank of India", color: "emerald", url: "https://www.onlinesbi.sbi/" },
];

const internationalBanks = [
  { name: "HDFC Bank (International)", color: "cyan", url: "https://www.hdfcbank.com/" },
  { name: "HSBC Global Bank", color: "rose", url: "https://www.hsbc.com/" },
  { name: "Citibank International", color: "amber", url: "https://www.citigroup.com/" },
];

function App() {
  return (
    <div className="container">
      <a href="#" className="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Dashboard
      </a>

      <header className="header-section">
        <div className="title-card">
          <h1 className="main-heading">How to Use Fraud Detection System</h1>
          <p className="sub-heading">Follow these simple steps to analyze transactions for fraud detection</p>
        </div>
      </header>

      <div className="dual-layout">
        {/* National Column */}
        <section className="column">
          <h2 className="column-header">National Banks</h2>
          <div className="card-stack">
            {nationalBanks.map((bank, index) => (
              <BankCard
                key={bank.name}
                index={index}
                displayIndex={index + 1}
                bankName={bank.name}
                colorClass={bank.color}
                url={bank.url}
              />
            ))}
          </div>
        </section>

        {/* International Column */}
        <section className="column">
          <h2 className="column-header">International Banks</h2>
          <div className="card-stack">
            {internationalBanks.map((bank, index) => (
              <BankCard
                key={bank.name}
                index={index + nationalBanks.length}
                displayIndex={index + 1}
                bankName={bank.name}
                colorClass={bank.color}
                url={bank.url}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
