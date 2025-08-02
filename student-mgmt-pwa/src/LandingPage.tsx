import { GraduationCap, Settings, BookOpen, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

const services = [
  {
    icon: <GraduationCap size={48} style={{ color: '#fff' }} />,
    title: 'Student Management',
    desc: 'Easily manage student records, admissions, and academic progress with a user-friendly interface.'
  },
  {
    icon: <Settings size={48} style={{ color: '#fff' }} />,
    title: 'Admin Dashboard',
    desc: 'Powerful dashboards for super admins and school admins to monitor and control operations.'
  },
  {
    icon: <BookOpen size={48} style={{ color: '#fff' }} />,
    title: 'Academic History',
    desc: 'Track and review academic history, attendance, and performance analytics.'
  }
];

const LandingPage = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  const containerStyle = {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box' as const
  };

  const mainCardStyle = {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    boxSizing: 'border-box' as const
  };

  const headerStyle = {
    textAlign: 'center' as const,
    padding: isMobile ? '2rem 1rem' : isTablet ? '3rem 2rem' : '4rem 3rem'
  };

  const titleStyle = {
    fontSize: isMobile ? '2rem' : isTablet ? '2.5rem' : '3.5rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '1.5rem',
    lineHeight: '1.2'
  };

  const subtitleStyle = {
    fontSize: isMobile ? '1.1rem' : isTablet ? '1.3rem' : '1.5rem',
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '2rem'
  };

  const descriptionStyle = {
    fontSize: isMobile ? '1rem' : '1.125rem',
    color: 'rgba(255, 255, 255, 0.8)',
    maxWidth: '768px',
    margin: '0 auto',
    lineHeight: '1.7'
  };

  const servicesContainerStyle = {
    padding: isMobile ? '0 1rem 2rem' : isTablet ? '0 2rem 3rem' : '0 3rem 4rem'
  };

  const servicesGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap: '1.5rem',
    width: '100%'
  };

  const serviceCardStyle = {
    background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center' as const,
    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box' as const
  };

  const serviceIconStyle = {
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'center'
  };

  const serviceTitleStyle = {
    fontSize: isMobile ? '1.1rem' : '1.25rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '0.75rem'
  };

  const serviceDescStyle = {
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '1.6',
    fontSize: isMobile ? '0.9rem' : '1rem'
  };

  const contactButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)',
    color: '#fff',
    fontWeight: 'bold',
    padding: '1rem 2rem',
    borderRadius: '12px',
    textDecoration: 'none',
    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    marginTop: '3rem',
    fontSize: isMobile ? '1rem' : '1.1rem'
  };

  const contactContainerStyle = {
    textAlign: 'center' as const,
    width: '100%'
  };

  return (
    <div style={containerStyle}>
      <div style={mainCardStyle}>
        
        {/* Header Section */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            Student Management System
          </h1>
          <h2 style={subtitleStyle}>
            Modern, Efficient, and Powerful School Administration
          </h2>
          <p style={descriptionStyle}>
            Streamline your school operations with our all-in-one platform for student records, 
            admin dashboards, and academic analytics.
          </p>
        </div>

        {/* Services Section */}
        <div style={servicesContainerStyle}>
          <div style={servicesGridStyle}>
            {services.map((service) => (
              <div 
                key={service.title} 
                style={serviceCardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 20px 40px -3px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={serviceIconStyle}>
                  {service.icon}
                </div>
                <h3 style={serviceTitleStyle}>
                  {service.title}
                </h3>
                <p style={serviceDescStyle}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Contact Button */}
          <div style={contactContainerStyle}>
            <a 
              href="mailto:contact@yourschool.com" 
              style={contactButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 20px 40px -3px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <Mail size={20} />
              Contact Us
            </a>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default LandingPage;