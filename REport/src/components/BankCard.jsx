import React from 'react';

const BankCard = ({ bankName, colorClass, url, index, displayIndex }) => {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`bank-card fade-in-up color-${colorClass}`}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="circular-icon">
                {displayIndex}
            </div>
            <h3 className="bank-name">{bankName}</h3>
            <div className="icon-right">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </div>
        </a>
    );
};

export default BankCard;
