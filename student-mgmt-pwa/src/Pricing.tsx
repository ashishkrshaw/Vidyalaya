import React, { useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PaymentIcon from '@mui/icons-material/Payment';
import SecurityIcon from '@mui/icons-material/Security';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QRCodeCanvas } from 'qrcode.react';
import './Pricing.css';

interface PricingProps {
    mode?: 'light' | 'dark';
}

interface SelectedPlan {
    name: string;
    price: number;
    billingCycle: 'monthly' | 'yearly';
    students: string;
}

const Pricing: React.FC<PricingProps> = ({ mode = 'light' }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const pricingPlans = [
        {
            name: "Starter",
            description: "Perfect for small schools",
            monthlyPrice: 0,
            yearlyPrice: 0,
            students: "Up to 100",
            icon: <LocalOfferIcon />,
            features: [
                { name: "Student Management", included: true },
                { name: "Fee Collection", included: true },
                { name: "PDF Receipts", included: true },
                { name: "Basic Reports", included: true },
                { name: "SMS Reminders", included: false },
                { name: "Online Payments", included: false },
                { name: "Custom Branding", included: false },
                { name: "Priority Support", included: false }
            ],
            cta: "Current Plan",
            popular: false,
            color: "blue"
        },
        {
            name: "Professional",
            description: "For growing schools",
            monthlyPrice: 1,
            yearlyPrice: 1,
            students: "Up to 500",
            icon: <StarIcon />,
            features: [
                { name: "Student Management", included: true },
                { name: "Fee Collection", included: true },
                { name: "PDF Receipts", included: true },
                { name: "Advanced Reports", included: true },
                { name: "SMS Reminders", included: true },
                { name: "Online Payments", included: true },
                { name: "Custom Branding", included: false },
                { name: "Priority Support", included: false }
            ],
            cta: "Upgrade Now",
            popular: true,
            color: "purple"
        },
        {
            name: "Enterprise",
            description: "For large institutions",
            monthlyPrice: 600,
            yearlyPrice: 480,
            students: "Unlimited",
            icon: <RocketLaunchIcon />,
            features: [
                { name: "Student Management", included: true },
                { name: "Fee Collection", included: true },
                { name: "PDF Receipts", included: true },
                { name: "Advanced Reports", included: true },
                { name: "SMS Reminders", included: true },
                { name: "Online Payments", included: true },
                { name: "Custom Branding", included: true },
                { name: "Priority Support", included: true }
            ],
            cta: "Upgrade Now",
            popular: false,
            color: "orange"
        }
    ];

    const handlePlanSelect = (plan: typeof pricingPlans[0]) => {
        const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

        if (price === 0) {
            // Free plan - no payment needed
            alert('You are already on the Starter plan!');
            return;
        }

        setSelectedPlan({
            name: plan.name,
            price: price,
            billingCycle: billingCycle,
            students: plan.students
        });
        setPaymentModalOpen(true);
    };

    const handlePayment = async () => {
        if (!selectedPlan) return;

        setIsProcessing(true);

        // Use the centralized secure URL generator
        const upiUrl = getPaymentUrl();

        // Immediate redirect
        window.location.href = upiUrl;

        // Reset processing state after delay
        setTimeout(() => setIsProcessing(false), 3000);
    };

    const getPaymentUrl = () => {
        if (!selectedPlan) return '';
        const amount = selectedPlan.billingCycle === 'yearly' ? selectedPlan.price * 12 : selectedPlan.price;
        const upiId = "9004213016@ybl";
        const payeeName = "ScholarBase";
        const transactionRef = "TXN" + Date.now() + Math.floor(Math.random() * 1000);
        const note = `Sub ${selectedPlan.name}`;
        const formattedAmount = amount.toFixed(2);

        return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&tr=${transactionRef}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
    };

    const copyLink = () => {
        navigator.clipboard.writeText(getPaymentUrl());
        alert("Payment Link Copied! You can paste it in your UPI app to pay.");
    };



    return (
        <div className={`pricing-page ${mode}`}>
            <div className="pricing-header">
                <div className="pricing-badge">
                    <LocalOfferIcon /> Pricing Plans
                </div>
                <h1>Choose the Right Plan for Your School</h1>
                <p>Simple, transparent pricing with no hidden fees. Upgrade or downgrade anytime.</p>

                <div className="billing-toggle">
                    <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
                    <button
                        className={`toggle-switch ${billingCycle === 'yearly' ? 'yearly' : ''}`}
                        onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
                    >
                        <div className="toggle-thumb"></div>
                    </button>
                    <span className={billingCycle === 'yearly' ? 'active' : ''}>
                        Yearly <span className="save-badge">Save 20%</span>
                    </span>
                </div>
            </div>

            <div className="pricing-grid">
                {pricingPlans.map((plan, index) => (
                    <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''} ${plan.color}`}>
                        {plan.popular && <div className="popular-badge">Most Popular</div>}

                        <div className="plan-icon">
                            {plan.icon}
                        </div>

                        <h3 className="plan-name">{plan.name}</h3>
                        <p className="plan-description">{plan.description}</p>

                        <div className="plan-price">
                            <span className="price-currency">₹</span>
                            <span className="price-amount">
                                {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                            </span>
                            <span className="price-period">/mo</span>
                        </div>

                        {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                            <div className="yearly-savings">
                                Save ₹{(plan.monthlyPrice - plan.yearlyPrice) * 12}/year
                            </div>
                        )}

                        <div className="plan-students">
                            <StorageIcon />
                            {plan.students} Students
                        </div>

                        <ul className="plan-features">
                            {plan.features.map((feature, i) => (
                                <li key={i} className={feature.included ? 'included' : 'excluded'}>
                                    {feature.included ? <CheckIcon /> : <CloseIcon />}
                                    {feature.name}
                                </li>
                            ))}
                        </ul>

                        <button
                            className={`plan-cta ${plan.popular ? 'primary' : 'secondary'}`}
                            onClick={() => handlePlanSelect(plan)}
                        >
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>

            <div className="pricing-footer">
                <div className="guarantee-box">
                    <h3>🛡️ 100% Satisfaction Guarantee</h3>
                    <p>Try any plan risk-free with our 7-day money-back guarantee.</p>
                </div>
                <div className="contact-box">
                    <h3>Need a Custom Plan?</h3>
                    <p>Contact us at <strong>aryanshashi31@gmail.com</strong> for enterprise solutions.</p>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && selectedPlan && (
                <div className="payment-modal-overlay" onClick={() => !isProcessing && setPaymentModalOpen(false)}>
                    <div className="payment-modal broader" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="modal-close-btn"
                            onClick={() => !isProcessing && setPaymentModalOpen(false)}
                            disabled={isProcessing}
                        >
                            <CloseIcon />
                        </button>

                        <div className="payment-content-wrapper">
                            {/* Left Side: Summary */}
                            <div className="payment-summary-section">
                                <div className="payment-header-compact">
                                    <div className="payment-icon-small">
                                        <PaymentIcon />
                                    </div>
                                    <div>
                                        <h2>Complete Purchase</h2>
                                        <p>{selectedPlan.name} Plan</p>
                                    </div>
                                </div>

                                <div className="payment-summary compact">
                                    <div className="summary-row">
                                        <span>Billing Cycle</span>
                                        <span>{selectedPlan.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Students</span>
                                        <span>{selectedPlan.students}</span>
                                    </div>
                                    <div className="summary-divider"></div>
                                    <div className="summary-row total">
                                        <span>Total Amount</span>
                                        <span className="total-amount">
                                            ₹{selectedPlan.billingCycle === 'yearly' ? selectedPlan.price * 12 : selectedPlan.price}
                                        </span>
                                    </div>
                                </div>

                                <div className="security-note compact">
                                    <SecurityIcon />
                                    <span>256-bit Secure Payment</span>
                                </div>
                            </div>

                            {/* Right Side: Payment Options */}
                            <div className="payment-actions-section">
                                <h4>Select Payment Method</h4>
                                <div className="payment-options">
                                    <label className={`payment-option ${!showQR ? 'selected' : ''}`} onClick={() => setShowQR(false)}>
                                        <div className="option-radio"></div>
                                        <span className="option-content">
                                            <span className="option-icon">💳</span>
                                            <span>Pay via App</span>
                                        </span>
                                    </label>

                                    <label className={`payment-option ${showQR ? 'selected' : ''}`} onClick={() => setShowQR(true)}>
                                        <div className="option-radio"></div>
                                        <span className="option-content">
                                            <span className="option-icon">�</span>
                                            <span>Scan QR Code</span>
                                        </span>
                                    </label>
                                </div>

                                {showQR ? (
                                    <div className="qr-code-container">
                                        <div className="qr-wrapper">
                                            <QRCodeCanvas
                                                value={getPaymentUrl()}
                                                size={150}
                                                level={"H"}
                                                includeMargin={true}
                                            />
                                        </div>
                                        <p className="qr-instruction">Scan with any UPI App</p>
                                        <p className="qr-amount">₹{selectedPlan.billingCycle === 'yearly' ? selectedPlan.price * 12 : selectedPlan.price}</p>
                                        <button className="copy-link-btn" onClick={copyLink}>
                                            <ContentCopyIcon fontSize="small" /> Copy Payment Link
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pay-action-container">
                                        <button
                                            className="pay-now-btn"
                                            onClick={handlePayment}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <span className="spinner"></span>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Pay ₹{selectedPlan.billingCycle === 'yearly' ? selectedPlan.price * 12 : selectedPlan.price}
                                                </>
                                            )}
                                        </button>
                                        <p className="redirect-note">Redirects to UPI App</p>
                                        <button className="copy-link-btn" onClick={copyLink}>
                                            <ContentCopyIcon fontSize="small" /> Copy Payment Link
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pricing;

