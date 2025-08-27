import React, { useState, useEffect } from 'react';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

interface AdmissionFormProps {
  onPreview: (data: any) => void;
  getNextRollNo: (cls: string, section: string) => Promise<number>;
}

// Custom Input Component with Glassmorphism Design
const CustomInput = ({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  readOnly = false,
  value,
  options = null,
  onChange,
  onFocus,
  onBlur,
  focusedField
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  value: any;
  options?: string[] | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFocus: (name: string) => void;
  onBlur: () => void;
  focusedField: string;
}) => {
  const isFocused = focusedField === name || (value !== '' && value !== undefined);
  
  return (
    <div style={{ marginBottom: '20px', width: '100%' }}>
      <div style={{
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(15px)',
        borderRadius: '15px',
        border: isFocused ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        boxShadow: isFocused ? '0 0 0 2px rgba(255, 255, 255, 0.1)' : 'none'
      }}>
        <label style={{
          position: 'absolute',
          left: '16px',
          top: isFocused ? '-8px' : '16px',
          fontSize: isFocused ? '12px' : '14px',
          color: isFocused ? '#fff' : 'rgba(255, 255, 255, 0.7)',
          background: isFocused ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)' : 'transparent',
          WebkitBackgroundClip: isFocused ? 'text' : 'initial',
          WebkitTextFillColor: isFocused ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
          backgroundClip: isFocused ? 'text' : 'initial',
          padding: isFocused ? '0 8px' : '0',
          borderRadius: '4px',
          transition: 'all 0.3s ease',
          fontWeight: isFocused ? '600' : '500',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {label} {required && <span style={{ color: '#ff6b6b' }}>*</span>}
        </label>
        
        {options ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => onFocus(name)}
            onBlur={onBlur}
            required={required}
            style={{
              width: '100%',
              padding: '20px 16px 12px 16px',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              borderRadius: '15px'
            }}
          >
            {name === 'class' && <option value="" style={{ background: '#333', color: '#fff' }}>Select Class</option>}
            {options.map(option => (
              <option key={option} value={option} style={{ background: '#333', color: '#fff', padding: '8px' }}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => onFocus(name)}
            onBlur={onBlur}
            required={required}
            readOnly={readOnly}
            style={{
              width: '100%',
              padding: '20px 16px 12px 16px',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              borderRadius: '15px',
              cursor: readOnly ? 'not-allowed' : 'text',
              opacity: readOnly ? 0.7 : 1,
              boxSizing: 'border-box'
            }}
          />
        )}
      </div>
    </div>
  );
};

// Custom Button Component
const CustomButton = ({ children, onClick, disabled = false }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '16px 32px',
        borderRadius: '15px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        color: '#fff',
        boxShadow: isHovered ? '0 6px 25px rgba(102, 126, 234, 0.6)' : '0 4px 15px rgba(102, 126, 234, 0.4)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.6 : 1,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      {children}
    </button>
  );
};

const AdmissionForm: React.FC<AdmissionFormProps> = ({ onPreview, getNextRollNo }) => {
  const [form, setForm] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    address: '',
    class: '',
    section: 'A',
    aadhar: '',
    dob: '',
    fatherMobile: '',
    email: '',
    apaar: '',
    note: '',
  });
  const [rollNo, setRollNo] = useState<number | ''>('');
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => {
    const fetchRollNo = async () => {
      if (form.class && form.section) {
        const next = await getNextRollNo(form.class, form.section);
        setRollNo(next);
      } else {
        setRollNo('');
      }
    };
    fetchRollNo();
  }, [form.class, form.section, getNextRollNo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPreview({ ...form, rollNo });
  };

  const setFocused = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const clearFocused = () => {
    setFocusedField('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '-160px',
          right: '-160px',
          width: '320px',
          height: '320px',
          background: 'rgba(59, 130, 246, 0.3)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-160px',
          left: '-160px',
          width: '320px',
          height: '320px',
          background: 'rgba(147, 51, 234, 0.3)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite 1s'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '240px',
          height: '240px',
          background: 'rgba(236, 72, 153, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite 2s'
        }} />
      </div>

      <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            textShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}>
            Student Admission Form
          </h1>
          <div style={{
            width: '96px',
            height: '4px',
            background: 'linear-gradient(45deg, #60a5fa, #a78bfa)',
            margin: '0 auto',
            borderRadius: '2px'
          }} />
        </div>

        {/* Form Container */}
        <div onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Main Form Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '25px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            marginBottom: '32px'
          }}>
            
            {/* Personal Information Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                  borderRadius: '8px',
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  👤
                </div>
                Personal Information
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                <CustomInput
                  label="Student Name"
                  name="name"
                  value={form.name}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Father's Name"
                  name="fatherName"
                  value={form.fatherName}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Mother's Name"
                  name="motherName"
                  value={form.motherName}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Address"
                  name="address"
                  value={form.address}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
              </div>
            </div>

            {/* Academic Information Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
                  borderRadius: '8px',
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  🎓
                </div>
                Academic Information
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                <CustomInput
                  label="Class"
                  name="class"
                  value={form.class}
                  options={classOptions}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Section"
                  name="section"
                  value={form.section}
                  options={sectionOptions}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Roll Number"
                  name="rollNo"
                  value={rollNo}
                  readOnly
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={form.dob}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
              </div>
            </div>

            {/* Contact & Documents Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(45deg, #ec4899, #ef4444)',
                  borderRadius: '8px',
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  📞
                </div>
                Contact & Documents
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                <CustomInput
                  label="Father's Mobile"
                  name="fatherMobile"
                  value={form.fatherMobile}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Email ID"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="Aadhar Number"
                  name="aadhar"
                  value={form.aadhar}
                  required
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
                <CustomInput
                  label="APAAR ID"
                  name="apaar"
                  value={form.apaar}
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
              </div>
            </div>

            {/* Additional Notes Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(45deg, #10b981, #14b8a6)',
                  borderRadius: '8px',
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  📝
                </div>
                Additional Information
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '24px'
              }}>
                <CustomInput
                  label="Special Notes"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  onFocus={setFocused}
                  onBlur={clearFocused}
                  focusedField={focusedField}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <CustomButton onClick={handleSubmit}>
              <span>Submit Admission</span>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </CustomButton>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.7;
          cursor: pointer;
        }
        
        select option {
          background-color: #1e293b;
          color: white;
          padding: 8px;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default AdmissionForm;