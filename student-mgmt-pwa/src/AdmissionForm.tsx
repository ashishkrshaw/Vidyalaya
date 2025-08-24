import React, { useState, useEffect } from 'react';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

interface AdmissionFormProps {
  onPreview: (data: any) => void;
  getNextRollNo: (cls: string, section: string) => Promise<number>;
}

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

  const InputField = ({ 
    label, 
    name, 
    type = 'text', 
    required = false, 
    readOnly = false,
    value,
    options = null 
  }: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    readOnly?: boolean;
    value: any;
    options?: string[] | null;
  }) => {
    const isFocused = focusedField === name || value !== '';
    
    return (
      <div className="relative group">
        <div className={`
          absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 
          group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-105
        `} />
        
        <div className={`
          relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-1
          transition-all duration-300 hover:bg-white/15 hover:border-white/30
          ${isFocused ? 'bg-white/15 border-white/40 shadow-lg' : ''}
        `}>
          <label className={`
            absolute left-4 transition-all duration-300 pointer-events-none text-white/80
            ${isFocused ? '-top-2 text-xs bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold px-2' : 'top-4 text-sm'}
          `}>
            {label} {required && <span className="text-pink-400">*</span>}
          </label>
          
          {options ? (
            <select
              name={name}
              value={value}
              onChange={handleChange}
              onFocus={() => setFocused(name)}
              onBlur={() => setFocused('')}
              required={required}
              className="w-full pt-6 pb-3 px-4 bg-transparent text-white placeholder-white/50 border-none outline-none text-sm"
            >
              {name === 'class' && <option value="">Select Class</option>}
              {options.map(option => (
                <option key={option} value={option} className="bg-slate-800 text-white">
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleChange}
              onFocus={() => setFocused(name)}
              onBlur={() => setFocused('')}
              required={required}
              readOnly={readOnly}
              className={`
                w-full pt-6 pb-3 px-4 bg-transparent text-white placeholder-white/50 border-none outline-none text-sm
                ${readOnly ? 'cursor-not-allowed opacity-70' : ''}
              `}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Student Admission Form
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full" />
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Form Card */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            
            {/* Personal Information Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3 flex items-center justify-center">
                  <span className="text-white text-sm">👤</span>
                </div>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField
                  label="Student Name"
                  name="name"
                  value={form.name}
                  required
                />
                <InputField
                  label="Father's Name"
                  name="fatherName"
                  value={form.fatherName}
                  required
                />
                <InputField
                  label="Mother's Name"
                  name="motherName"
                  value={form.motherName}
                  required
                />
                <InputField
                  label="Address"
                  name="address"
                  value={form.address}
                  required
                />
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mr-3 flex items-center justify-center">
                  <span className="text-white text-sm">🎓</span>
                </div>
                Academic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField
                  label="Class"
                  name="class"
                  value={form.class}
                  options={classOptions}
                  required
                />
                <InputField
                  label="Section"
                  name="section"
                  value={form.section}
                  options={sectionOptions}
                  required
                />
                <InputField
                  label="Roll Number"
                  name="rollNo"
                  value={rollNo}
                  readOnly
                />
                <InputField
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={form.dob}
                  required
                />
              </div>
            </div>

            {/* Contact & Documents Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-600 rounded-lg mr-3 flex items-center justify-center">
                  <span className="text-white text-sm">📞</span>
                </div>
                Contact & Documents
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField
                  label="Father's Mobile"
                  name="fatherMobile"
                  value={form.fatherMobile}
                  required
                />
                <InputField
                  label="Email ID"
                  name="email"
                  type="email"
                  value={form.email}
                />
                <InputField
                  label="Aadhar Number"
                  name="aadhar"
                  value={form.aadhar}
                  required
                />
                <InputField
                  label="APAAR ID"
                  name="apaar"
                  value={form.apaar}
                />
              </div>
            </div>

            {/* Additional Notes Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white/90 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg mr-3 flex items-center justify-center">
                  <span className="text-white text-sm">📝</span>
                </div>
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <InputField
                  label="Special Notes"
                  name="note"
                  value={form.note}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Button background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button content */}
              <span className="relative flex items-center space-x-2">
                <span>Submit Admission</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              
              {/* Ripple effect */}
              <div className="absolute inset-0 -top-2 -bottom-2 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.7;
        }
        
        select option {
          background-color: #1e293b;
          color: white;
          padding: 8px;
        }
        
        /* Custom scrollbar for better aesthetics */
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