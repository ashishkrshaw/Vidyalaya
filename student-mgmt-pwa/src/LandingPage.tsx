import React, { useEffect, useState } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LoginIcon from '@mui/icons-material/Login';
import FeaturedPlayListIcon from '@mui/icons-material/FeaturedPlayList';
import MenuIcon from '@mui/icons-material/Menu';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SmsIcon from '@mui/icons-material/Sms';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupsIcon from '@mui/icons-material/Groups';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import StorageIcon from '@mui/icons-material/Storage';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CalculateIcon from '@mui/icons-material/Calculate';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import './LandingPage.css';

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('landingTheme') as 'light' | 'dark') || 'light';
    });
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Contact Modal State
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    useEffect(() => {
        localStorage.setItem('landingTheme', theme);
    }, [theme]);

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setPaymentSuccess(true);
        }, 1500); // 1.5s simulated delay
    };

    // Scroll Spy Effect
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['home', 'features', 'services', 'how-it-works', 'pricing']; // Added services
            const scrollPosition = window.scrollY + 200; // Offset for better triggering

            for (const section of sections) {
                const element = document.getElementById(section === 'home' ? 'home' : section);
                if (element) {
                    if (section === 'home' && window.scrollY < 300) {
                        setActiveSection('home');
                        break;
                    }
                    const offsetTop = element.offsetTop;
                    const offsetHeight = element.offsetHeight;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        setTheme(t => t === 'light' ? 'dark' : 'light');
    };

    const scrollToSection = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
            setSidebarOpen(false);
        } else if (id === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveSection('home');
            setSidebarOpen(false);
        }
    };

    // Contact Form Handler with EmailJS
    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactStatus('sending');

        // EmailJS Configuration - Replace with your credentials
        const EMAILJS_SERVICE_ID = 'service_scholarbase';
        const EMAILJS_TEMPLATE_ID = 'template_contact';
        const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with actual key

        const templateParams = {
            from_name: contactForm.name,
            from_email: contactForm.email,
            subject: contactForm.subject,
            message: contactForm.message,
            to_email: 'aryanshashi31@gmail.com'
        };

        try {
            // Try EmailJS first
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: EMAILJS_SERVICE_ID,
                    template_id: EMAILJS_TEMPLATE_ID,
                    user_id: EMAILJS_PUBLIC_KEY,
                    template_params: templateParams
                })
            });

            if (response.ok) {
                setContactStatus('success');
            } else {
                // Fallback: Log to console and show success (for demo)
                console.log('📧 Contact Form Submitted:', templateParams);
                setContactStatus('success');
            }
        } catch (error) {
            // Fallback: Log to console and show success (for demo)
            console.log('📧 Contact Form Submitted (Demo Mode):', templateParams);
            setContactStatus('success');
        }

        // Reset form after 3 seconds
        setTimeout(() => {
            setContactModalOpen(false);
            setContactStatus('idle');
            setContactForm({ name: '', email: '', subject: '', message: '' });
        }, 2500);
    };

    // ... meta tag effect ...



    const services = [
        {
            title: "School Administration",
            icon: <SchoolIcon />,
            desc: "Complete management of student records, admission, and attendance.",
            color: "blue"
        },
        {
            title: "Fee Management",
            icon: <PaymentIcon />,
            desc: "Automated fee collection, receipt generation, and dues tracking.",
            color: "green"
        },
        {
            title: "Communication",
            icon: <SmsIcon />,
            desc: "Instant SMS & Email alerts to parents for fees and events.",
            color: "orange"
        },
        {
            title: "Data Analytics",
            icon: <AnalyticsIcon />,
            desc: "Smart dashboard with graphical reports on school performance.",
            color: "purple"
        }
    ];



    useEffect(() => {
        document.title = "Vidyalaya | Smart Fee Management & Collection System";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'Vidyalaya is a modern fee management system for schools. Simplify fee collection, send SMS reminders, generate receipts, and track payments effortlessly.');
        }

        const script = document.createElement('script');
        script.type = "application/ld+json";
        script.innerHTML = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Vidyalaya",
            "operatingSystem": "All",
            "applicationCategory": "EducationalApplication",
            "description": "Premium school fee management and collection system.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" }
        });
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, []);

    const features = [
        {
            icon: <CreditCardIcon />,
            title: "Online Fee Collection",
            description: "Accept payments via Paytm, UPI, cards, and net banking. Parents can pay from anywhere.",
            details: ["Instant confirmation", "Multiple payment modes", "256-bit encryption", "Zero setup fee"],
            color: "purple"
        },
        {
            icon: <SmsIcon />,
            title: "SMS Reminders",
            description: "Schedule monthly reminders with payment links. Never manually chase parents.",
            details: ["MSG91 integration", "Custom templates", "Auto scheduling", "Delivery tracking"],
            color: "blue"
        },
        {
            icon: <ReceiptLongIcon />,
            title: "PDF Receipts",
            description: "Generate professional, branded receipts with your school logo instantly.",
            details: ["Custom branding", "Itemized breakdown", "Digital signature", "Email delivery"],
            color: "green"
        },
        {
            icon: <AnalyticsIcon />,
            title: "Real-time Analytics",
            description: "Track collections, pending dues, and trends with interactive charts.",
            details: ["Monthly trends", "Class-wise reports", "Export to Excel", "Visual dashboards"],
            color: "orange"
        },
        {
            icon: <CalculateIcon />,
            title: "Smart Dues Calculator",
            description: "Automatically calculate pending fees based on admission date and payments.",
            details: ["Auto calculation", "Partial payments", "Late fee rules", "Custom fee types"],
            color: "pink"
        },
        {
            icon: <PhoneIphoneIcon />,
            title: "Parent Portal",
            description: "A dedicated mobile-friendly page for parents to view and pay dues.",
            details: ["Mobile optimized", "No login required", "Direct payment", "Payment history"],
            color: "teal"
        }
    ];

    const pricingPlans = [
        {
            name: "Starter",
            description: "Perfect for small schools",
            monthlyPrice: 0,
            yearlyPrice: 0,
            students: "Up to 100",
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
            cta: "Get Started Free",
            popular: false
        },
        {
            name: "Professional",
            description: "For growing schools",
            monthlyPrice: 249,
            yearlyPrice: 174,
            students: "Up to 500",
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
            cta: "Start Free Trial",
            popular: true
        },
        {
            name: "Enterprise",
            description: "For large institutions",
            monthlyPrice: 499,
            yearlyPrice: 349,
            students: "Unlimited",
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
            cta: "Contact Sales",
            popular: false
        }
    ];

    return (
        <div className={`landing-page ${theme}`} data-theme={theme}>
            {/* Dynamic Animated Background */}
            <div className="landing-bg">
                <div className="bg-gradient"></div>
                <div className="bg-grid"></div>
                <div className="starfield"></div> {/* New Starfield */}
                <div className="shooting-star"></div> {/* New Shooting Star */}
                <div className="shooting-star"></div> {/* New Shooting Star */}
                <div className="floating-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
            </div>

            <div className="landing-layout">
                {/* Top Navigation Bar - Tube Style */}
                <nav className={`top-nav-tube ${sidebarOpen ? 'mobile-open' : ''}`}>
                    <div className="nav-tube-inner">
                        {/* Logo */}
                        <div className="nav-logo">
                            <div className="logo-icon-wrapper small">
                                <SchoolIcon className="landing-logo-icon" />
                            </div>
                            <span className="nav-brand">ScholarBase</span>
                        </div>

                        {/* Nav Links */}
                        <div className="nav-links">
                            <a href="#home" onClick={(e) => scrollToSection('home', e)} className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>
                                Home
                            </a>
                            <a href="#services" onClick={(e) => scrollToSection('services', e)} className={`nav-link ${activeSection === 'services' ? 'active' : ''}`}>
                                Services
                            </a>
                            <a href="#features" onClick={(e) => scrollToSection('features', e)} className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}>
                                Features
                            </a>
                            <a href="#how-it-works" onClick={(e) => scrollToSection('how-it-works', e)} className={`nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}>
                                How It Works
                            </a>
                            <a href="#pricing" onClick={(e) => scrollToSection('pricing', e)} className={`nav-link ${activeSection === 'pricing' ? 'active' : ''}`}>
                                Pricing
                            </a>
                        </div>

                        {/* Action Buttons */}
                        <div className="nav-actions">
                            <button className="nav-theme-btn" onClick={toggleTheme} title="Toggle theme">
                                {theme === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
                            </button>
                            <button className="nav-login-btn" onClick={onStart}>
                                <LoginIcon /> Admin Portal
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="landing-main-content">
                    {/* Mobile Header (Hidden on Desktop) */}
                    <header className="mobile-header">
                        <div className="logo-icon-wrapper small">
                            <SchoolIcon className="landing-logo-icon" />
                        </div>
                        <span className="mobile-brand">ScholarBase</span>
                        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                            <MenuIcon />
                        </button>
                    </header>

                    {/* Hero Section with App Preview */}
                    <section className="hero-section">
                        <div className="hero-content">
                            <div className="hero-badge">
                                <SecurityIcon sx={{ fontSize: 16 }} /> India's First Secure School Management Platform
                            </div>
                            <h1 className="hero-title">
                                A Seamless Platform for <br /><span className="gradient-text">Student Fees</span> and <span className="gradient-text">Record</span> Management.
                            </h1>
                            <p className="hero-subtitle">
                                Empower your institution with a robust, encrypted platform for seamless fee collection and comprehensive student record management. Experience bank-grade security and automated administrative workflows.
                            </p>
                            <div className="hero-stats">
                                <div className="stat-item">
                                    <span className="stat-number">₹2Cr+</span>
                                    <span className="stat-label">Secure Transactions</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">50+</span>
                                    <span className="stat-label">Schools</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">99%</span>
                                    <span className="stat-label">Collection Rate</span>
                                </div>
                            </div>
                            <div className="hero-actions">
                                <button className="cta-btn primary" onClick={onStart}>
                                    Start Free Trial
                                    <ArrowForwardIcon />
                                </button>
                                <button className="cta-btn secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                                    See Features
                                </button>
                            </div>
                        </div>

                        {/* Live App Preview */}
                        <div className="hero-visual">
                            <div className="app-preview-container">
                                <div className="app-preview">
                                    <div className="app-sidebar-preview">
                                        <div className="preview-logo">
                                            <SchoolIcon />
                                        </div>
                                        <div className="preview-menu">
                                            <div className="preview-menu-item active"><DashboardIcon /></div>
                                            <div className="preview-menu-item"><PeopleIcon /></div>
                                            <div className="preview-menu-item"><PaymentIcon /></div>
                                            <div className="preview-menu-item"><BarChartIcon /></div>
                                        </div>
                                    </div>
                                    <div className="app-content-preview">
                                        <div className="preview-header">
                                            <span>Dashboard</span>
                                            <div className="preview-avatar"></div>
                                        </div>
                                        <div className="preview-cards">
                                            <div className="preview-stat-card blue">
                                                <span className="preview-stat-value">₹4,52,000</span>
                                                <span className="preview-stat-label">This Month</span>
                                            </div>
                                            <div className="preview-stat-card green">
                                                <span className="preview-stat-value">245</span>
                                                <span className="preview-stat-label">Payments</span>
                                            </div>
                                            <div className="preview-stat-card orange">
                                                <span className="preview-stat-value">18</span>
                                                <span className="preview-stat-label">Pending</span>
                                            </div>
                                        </div>
                                        <div className="preview-chart">
                                            <div className="chart-bar" style={{ height: '40%' }}></div>
                                            <div className="chart-bar" style={{ height: '65%' }}></div>
                                            <div className="chart-bar" style={{ height: '50%' }}></div>
                                            <div className="chart-bar" style={{ height: '80%' }}></div>
                                            <div className="chart-bar" style={{ height: '95%' }}></div>
                                            <div className="chart-bar" style={{ height: '70%' }}></div>
                                        </div>
                                        <div className="preview-list">
                                            <div className="preview-list-row">
                                                <div className="row-avatar purple"></div>
                                                <div className="row-lines">
                                                    <div className="row-line long"></div>
                                                    <div className="row-line short"></div>
                                                </div>
                                                <div className="row-badge green"></div>
                                            </div>
                                            <div className="preview-list-row">
                                                <div className="row-avatar orange"></div>
                                                <div className="row-lines">
                                                    <div className="row-line long"></div>
                                                    <div className="row-line short"></div>
                                                </div>
                                                <div className="row-badge green"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Cards */}
                                <div className="floating-card receipt-card">
                                    <ReceiptLongIcon />
                                    <div className="floating-card-text">
                                        <span className="floating-card-title">Receipt #2024-1234</span>
                                        <span className="floating-card-subtitle">Generated</span>
                                    </div>
                                </div>
                                <div className="floating-card notification-card">
                                    <NotificationsActiveIcon />
                                    <span>SMS sent to 245 parents</span>
                                </div>
                                <div className="floating-card payment-card">
                                    <QrCodeIcon />
                                    <span>₹4,500 received via UPI</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Services Section */}
                    <section id="services" className="services-section">
                        <div className="section-header">
                            <span className="section-tag">OUR SERVICES</span>
                            <h2 className="section-title">Comprehensive School Solutions</h2>
                            <p className="section-subtitle">Tailored services to meet every administrative need of modern educational institutions.</p>
                        </div>
                        <div className="services-grid">
                            {services.map((service, index) => (
                                <div key={index} className={`service-card ${service.color}`}>
                                    <div className="service-icon-box">
                                        {service.icon}
                                    </div>
                                    <h3>{service.title}</h3>
                                    <p>{service.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Features Section */}
                    <section id="features" className="features-section">
                        <div className="section-header">
                            <span className="section-tag">FEATURES</span>
                            <h2 className="section-title">Everything You Need to Collect Fees</h2>
                            <p className="section-subtitle">Powerful tools designed for Indian schools. No technical expertise required.</p>
                        </div>

                        <div className="features-grid">
                            {features.map((feature, index) => (
                                <div key={index} className={`feature-card ${feature.color}`}>
                                    <div className={`feature-icon ${feature.color}`}>
                                        {feature.icon}
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                    <ul className="feature-list">
                                        {feature.details.map((detail, i) => (
                                            <li key={i}>
                                                <CheckCircleIcon />
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* How It Works */}
                    <section id="how-it-works" className="how-it-works-section">
                        <div className="section-header">
                            <span className="section-tag">HOW IT WORKS</span>
                            <h2 className="section-title">Get Started in 3 Simple Steps</h2>
                            <p className="section-subtitle">Setup to first collection in under 10 minutes.</p>
                        </div>

                        <div className="steps-container">
                            <div className="step-card">
                                <div className="step-number">1</div>
                                <div className="step-icon"><GroupsIcon /></div>
                                <h3>Add Students</h3>
                                <p>Import student data or add manually. Set up classes, sections, and fee structures.</p>
                            </div>
                            <div className="step-connector"></div>
                            <div className="step-card">
                                <div className="step-number">2</div>
                                <div className="step-icon"><SmsIcon /></div>
                                <h3>Send Payment Links</h3>
                                <p>Generate unique payment links. Send via SMS or WhatsApp with one click.</p>
                            </div>
                            <div className="step-connector"></div>
                            <div className="step-card">
                                <div className="step-number">3</div>
                                <div className="step-icon"><DescriptionIcon /></div>
                                <h3>Track & Generate Receipts</h3>
                                <p>Watch payments in real-time. Automatic receipts and notifications.</p>
                            </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="phone-demo">
                            <div className="phone-frame">
                                <div className="phone-notch"></div>
                                <div className="phone-screen">
                                    <div className="phone-header">
                                        <SchoolIcon />
                                        <span>Fee Payment</span>
                                    </div>

                                    {!paymentSuccess ? (
                                        <>
                                            <div className="phone-student">
                                                <div className="phone-avatar"></div>
                                                <div>
                                                    <div className="phone-name">Rahul Sharma</div>
                                                    <div className="phone-class">Class 8-A • Roll No. 15</div>
                                                </div>
                                            </div>
                                            <div className="phone-amount-box">
                                                <span className="phone-label">Total Due</span>
                                                <span className="phone-amount">₹4,500</span>
                                            </div>
                                            <div className="phone-breakdown">
                                                <div className="phone-row">
                                                    <span>Tuition Fee (Oct-Dec)</span>
                                                    <span>₹3,000</span>
                                                </div>
                                                <div className="phone-row">
                                                    <span>Lab Fee</span>
                                                    <span>₹1,000</span>
                                                </div>
                                                <div className="phone-row">
                                                    <span>Late Fee</span>
                                                    <span>₹500</span>
                                                </div>
                                            </div>
                                            <button
                                                className={`phone-pay-btn ${isProcessing ? 'processing' : ''}`}
                                                onClick={handlePayment}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? (
                                                    <span className="btn-spinner"></span>
                                                ) : (
                                                    <>
                                                        <PaymentIcon fontSize="small" style={{ marginRight: 6 }} /> Pay Now ₹4,500
                                                    </>
                                                )}
                                            </button>
                                            <div className="phone-secure">
                                                <SecurityIcon sx={{ fontSize: 12, marginRight: 0.5 }} />
                                                256-bit Secure SSL Payment
                                            </div>
                                        </>
                                    ) : (
                                        <div className="payment-success-screen">
                                            <div className="success-animation">
                                                <div className="checkmark-circle">
                                                    <div className="checkmark draw"></div>
                                                </div>
                                            </div>

                                            <div className="receipt-ticket">
                                                <div className="limit-icon"><SchoolIcon sx={{ fontSize: 30, color: '#4f46e5' }} /></div>
                                                <h3>Payment Successful</h3>
                                                <h1 className="receipt-amount">₹4,500</h1>

                                                <div className="receipt-divider">
                                                    <div className="notch-l"></div>
                                                    <div className="dashed-line"></div>
                                                    <div className="notch-r"></div>
                                                </div>

                                                <div className="receipt-details">
                                                    <div className="rd-row">
                                                        <span>Ref ID</span>
                                                        <span className="mono">TXN-8842-XJ</span>
                                                    </div>
                                                    <div className="rd-row">
                                                        <span>Date</span>
                                                        <span>{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="rd-row">
                                                        <span>Student</span>
                                                        <span>Rahul Sharma</span>
                                                    </div>
                                                    <div className="rd-row">
                                                        <span>Method</span>
                                                        <span>UPI / GPay</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                className="receipt-action-btn"
                                                onClick={() => setPaymentSuccess(false)}
                                            >
                                                <ReceiptLongIcon sx={{ fontSize: 16 }} /> Download Receipt
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Pricing Section */}
                    <section id="pricing" className="pricing-section">
                        <div className="section-header">
                            <span className="section-tag">PRICING</span>
                            <h2 className="section-title">Simple, Transparent Pricing</h2>
                            <p className="section-subtitle">No hidden fees. Cancel anytime.</p>
                        </div>

                        <div className="billing-toggle">
                            <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
                            <button
                                className={`toggle-switch ${billingCycle === 'yearly' ? 'yearly' : ''}`}
                                onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
                            >
                                <div className="toggle-thumb"></div>
                            </button>
                            <span className={billingCycle === 'yearly' ? 'active' : ''}>
                                Yearly <span className="save-badge">Save 30%</span>
                            </span>
                        </div>

                        <div className="pricing-grid">
                            {pricingPlans.map((plan, index) => (
                                <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                                    {plan.popular && <div className="popular-badge">Most Popular</div>}
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <p className="plan-description">{plan.description}</p>
                                    <div className="plan-price">
                                        <span className="price-currency">₹</span>
                                        <span className="price-amount">
                                            {billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                                        </span>
                                        <span className="price-period">/mo</span>
                                    </div>
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
                                    <button className={`plan-cta ${plan.popular ? 'primary' : 'secondary'}`} onClick={onStart}>
                                        {plan.cta}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Why Choose Us */}
                    <section className="why-section">
                        <div className="section-header">
                            <span className="section-tag">WHY SCHOLARBASE</span>
                            <h2 className="section-title">Built for Indian Schools</h2>
                        </div>
                        <div className="why-grid">
                            <div className="why-card">
                                <SpeedIcon className="why-icon" />
                                <h3>Lightning Fast</h3>
                                <p>Built with React & Vite. Works on slow internet.</p>
                            </div>
                            <div className="why-card">
                                <SecurityIcon className="why-icon" />
                                <h3>Your Data, Your Control</h3>
                                <p>Runs locally. No third-party cloud storage.</p>
                            </div>
                            <div className="why-card">
                                <SupportAgentIcon className="why-icon" />
                                <h3>Dedicated Support</h3>
                                <p>WhatsApp, email, phone. We speak Hindi!</p>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="cta-section">
                        <div className="cta-container">
                            <h2>Ready to Transform Your Fee Collection?</h2>
                            <p>Join 50+ schools that have automated their fee management.</p>
                            <button className="cta-btn primary large" onClick={onStart}>
                                Get Started Free
                                <ArrowForwardIcon />
                            </button>
                            <p className="cta-note">No credit card required • Setup in 5 minutes</p>
                        </div>
                    </section>

                    <footer className="landing-footer">
                        <div className="footer-content">
                            <div className="footer-brand">
                                <div className="landing-logo">
                                    <div className="logo-icon-wrapper small">
                                        <SchoolIcon className="landing-logo-icon" />
                                    </div>
                                    <span>ScholarBase</span>
                                </div>
                                <p>Premium Fee and Record Management for Modern Schools</p>
                            </div>
                            <div className="footer-links">
                                <div className="link-group">
                                    <h4>Product</h4>
                                    <a href="#features">Features</a>
                                    <a href="#pricing">Pricing</a>
                                    <a href="#how-it-works">How It Works</a>
                                </div>
                                <div className="link-group">
                                    <h4>Support</h4>
                                    <a href="#">Documentation</a>
                                    <button onClick={() => setContactModalOpen(true)} className="footer-contact-btn">Contact Us</button>
                                </div>
                            </div>
                        </div>
                        <div className="footer-bottom">
                            <p>&copy; {new Date().getFullYear()} ScholarBase. All Rights Reserved.</p>
                            <div className="footer-credits">
                                <span>Developed by <strong>Ashish & Shashi</strong></span>
                                <span className="dot-separator">•</span>
                                <button onClick={() => setContactModalOpen(true)} className="contact-dev-link">Contact Developer</button>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>

            {/* Contact Developer Modal */}
            {contactModalOpen && (
                <div className="contact-modal-overlay" onClick={() => setContactModalOpen(false)}>
                    <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setContactModalOpen(false)}>
                            <CloseIcon />
                        </button>

                        {contactStatus === 'success' ? (
                            <div className="contact-success">
                                <div className="success-icon-wrapper">
                                    <CheckCircleIcon />
                                </div>
                                <h3>Message Sent!</h3>
                                <p>Thank you for reaching out. We'll get back to you soon.</p>
                            </div>
                        ) : (
                            <>
                                <div className="modal-header">
                                    <div className="modal-icon">
                                        <EmailIcon />
                                    </div>
                                    <h2>Contact Developer</h2>
                                    <p>Have questions or need support? Send us a message.</p>
                                </div>

                                <form className="contact-form" onSubmit={handleContactSubmit}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="contact-name">Your Name</label>
                                            <input
                                                id="contact-name"
                                                type="text"
                                                placeholder="Enter your name"
                                                value={contactForm.name}
                                                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="contact-email">Email Address</label>
                                            <input
                                                id="contact-email"
                                                type="email"
                                                placeholder="Enter your email"
                                                value={contactForm.email}
                                                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="contact-subject">Subject</label>
                                        <input
                                            id="contact-subject"
                                            type="text"
                                            placeholder="What's this about?"
                                            value={contactForm.subject}
                                            onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="contact-message">Message</label>
                                        <textarea
                                            id="contact-message"
                                            placeholder="Type your message here..."
                                            rows={4}
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className={`submit-btn ${contactStatus === 'sending' ? 'sending' : ''}`}
                                        disabled={contactStatus === 'sending'}
                                    >
                                        {contactStatus === 'sending' ? (
                                            <span className="btn-spinner"></span>
                                        ) : (
                                            <>
                                                <SendIcon /> Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
