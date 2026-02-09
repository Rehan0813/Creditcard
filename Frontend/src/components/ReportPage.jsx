import React from 'react';

/**
 * ReportPage: Compliance-Grade Fraud Report Confirmation
 * Designed for enterprise auditors and security teams.
 * Aesthetic: Serious, restrained, and trustworthy.
 */
const ReportPage = ({ result, setCurrentPage }) => {
    // Helper to format date
    const formatDate = (dateStr) => {
        try {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            return date.toLocaleString('default', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr || 'N/A';
        }
    };

    const isIndia = result?.country?.toLowerCase() === 'india';

    // Styling constants for serious enterprise look
    const colors = {
        bgCard: '#1e293b', // Solid navy/slate, minimal transparency
        bgCardHeader: '#0f172a', // Darker header for contrast
        border: 'rgba(148, 163, 184, 0.15)',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
        accentMuted: '#64748b',
        buttonBg: '#334155',
        buttonText: '#ffffff'
    };

    return (
        <div style={{
            position: 'relative',
            padding: '60px 20px 120px',
            minHeight: '100%',
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>

            {/* 1. Confirmation Message (SUBTLE) */}
            <div style={{ textAlign: 'left', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ color: '#10b981', fontSize: '18px' }}>●</span>
                    <h1 style={{
                        color: colors.textMain,
                        fontSize: '24px',
                        fontWeight: '600',
                        margin: 0
                    }}>
                        Report Submitted
                    </h1>
                </div>
                <p style={{
                    color: colors.textMuted,
                    fontSize: '15px',
                    margin: 0,
                    lineHeight: '1.5'
                }}>
                    Your fraud report has been successfully recorded and assigned a reference ID.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* 2. Report Summary (READ-ONLY) */}
                <div style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '16px 24px',
                        background: colors.bgCardHeader,
                        borderBottom: `1px solid ${colors.border}`
                    }}>
                        <h2 style={{ color: colors.textMain, fontSize: '14px', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Report Summary</h2>
                    </div>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <SummaryItem label="Reference ID" value={result?.prediction_id ? `RID-${result.prediction_id.toString().slice(0, 8).toUpperCase()}` : 'PENDING'} colors={colors} />
                        <SummaryItem label="Fraud Classification" value={result?.riskLevel || 'Suspicious Activity'} colors={colors} />
                        <SummaryItem label="Amount" value={result?.amount ? `$${result.amount}` : 'N/A'} colors={colors} />
                        <SummaryItem label="Transaction Date" value={formatDate(result?.transactionTime)} colors={colors} />
                        <SummaryItem label="Payment Method" value={result?.paymentMethod || 'N/A'} colors={colors} />
                        <SummaryItem label="Jurisdiction" value={result?.country || 'N/A'} colors={colors} />
                    </div>
                </div>

                <div>
                    <h3 style={{ color: colors.textMain, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>What You Should Do Next</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <NumberedStep
                            number="1"
                            title="Block your card or account"
                            desc="Contact your financial institution immediately via their official mobile app or the emergency number on the reverse of your card."
                            colors={colors}
                        />
                        <NumberedStep
                            number="2"
                            title="Audit recent activity"
                            desc="Review your last 10 transactions for any other unauthorized charges and document them for the bank."
                            colors={colors}
                        />
                        <NumberedStep
                            number="3"
                            title="Formal Dispute Filing"
                            desc="Initiate a formal dispute with your card issuer. In most regions, this must be completed within 48 hours for maximum protection."
                            colors={colors}
                        />
                        <NumberedStep
                            number="4"
                            title="Security Protocol Update"
                            desc="Update passwords and enable Multi-Factor Authentication (MFA) on all banking and primary email accounts."
                            colors={colors}
                        />
                    </div>
                </div>

                {/* 4. Expectation Management */}
                <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <h4 style={{ color: colors.textMain, fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Investigation & Timeline</h4>
                    <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                        Fraud investigations are conducted by the respective card issuers and typically range from 7 to 45 business days.
                        This platform provides analysis and documentation support, but final account adjustments and liability decisions are determined by your bank.
                    </p>
                    {isIndia && (
                        <p style={{ marginTop: '12px', color: '#bae6fd', fontSize: '12px', fontStyle: 'italic' }}>
                            Notice: For transactions in India, the RBI mandates temporary credit for reported fraud within 10 working days, subject to bank verification.
                        </p>
                    )}
                </div>
            </div>

            {/* 5. Actions (ONLY REAL ONES) */}
            <div style={{
                marginTop: '48px',
                paddingTop: '32px',
                borderTop: `1px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => setCurrentPage('dashboard')}
                        style={{
                            padding: '12px 32px',
                            background: colors.buttonBg,
                            border: 'none',
                            borderRadius: '6px',
                            color: colors.buttonText,
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease'
                        }}
                        onMouseOver={e => e.target.style.background = '#475569'}
                        onMouseOut={e => e.target.style.background = colors.buttonBg}
                    >
                        Return to Dashboard
                    </button>
                    <button
                        onClick={() => setCurrentPage('dashboard')}
                        style={{
                            padding: '12px 32px',
                            background: 'transparent',
                            border: `1px solid ${colors.accentMuted}`,
                            borderRadius: '6px',
                            color: colors.textMain,
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Analyze Another Transaction
                    </button>
                </div>
            </div>
        </div>
    );
};

// Sub-components for cleaner code
const SummaryItem = ({ label, value, colors }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
        <span style={{ color: colors.textMuted, fontSize: '13px', fontWeight: '500' }}>{label}</span>
        <span style={{ color: colors.textMain, fontSize: '14px', fontWeight: '600' }}>{value}</span>
    </div>
);

const NumberedStep = ({ number, title, desc, colors }) => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{
            marginTop: '2px',
            minWidth: '24px',
            height: '24px',
            borderRadius: '50%',
            background: colors.bgCardHeader,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textMain,
            fontSize: '12px',
            fontWeight: 'bold'
        }}>{number}</div>
        <div>
            <div style={{ color: colors.textMain, fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{title}</div>
            <div style={{ color: colors.textMuted, fontSize: '13px', lineHeight: '1.5' }}>{desc}</div>
        </div>
    </div>
);

export default ReportPage;
