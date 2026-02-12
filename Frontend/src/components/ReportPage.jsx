import React from 'react';
import '../styles/ReportPage.css';

const nationalBanks = [
    { name: "HDFC Bank", color: "cyan", url: "https://www.hdfcbank.com/" },
    { name: "ICICI Bank", color: "purple", url: "https://www.icicibank.com/" },
    { name: "Axis Bank", color: "orange", url: "https://www.axisbank.com/" },
    { name: "State Bank of India", color: "emerald", url: "https://www.onlinesbi.sbi/" },
];

const internationalBanks = [
    { name: "HSBC Global Bank", color: "rose", url: "https://www.hsbc.com/" },
    { name: "Citibank International", color: "amber", url: "https://www.citigroup.com/" },
    { name: "Barclays Bank", color: "cyan", url: "https://www.barclays.co.uk/" },
];

const BankCard = ({ bankName, colorClass, url, index, displayIndex }) => {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`report-bank-card report-fade-in-up report-color-${colorClass}`}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="report-circular-icon">
                {displayIndex}
            </div>
            <h3 className="report-bank-name">{bankName}</h3>
            <div className="report-icon-right">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </div>
        </a>
    );
};

const ReportPage = ({ result, setCurrentPage }) => {
    return (
        <div className="report-container">
            <button onClick={() => setCurrentPage('dashboard')} className="report-back-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Dashboard
            </button>

            <header className="report-header-section">
                <div className="report-title-card">
                    <h1 className="report-main-heading">How to Use Fraud Detection System</h1>
                    <p className="report-sub-heading">Follow these simple steps to analyze transactions for fraud detection</p>
                </div>
            </header>

            <div className="report-dual-layout">
                {/* National Column */}
                <section className="report-column">
                    <h2 className="report-column-header">National Banks</h2>
                    <div className="report-card-stack">
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
                <section className="report-column">
                    <h2 className="report-column-header">International Banks</h2>
                    <div className="report-card-stack">
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
};

export default ReportPage;
