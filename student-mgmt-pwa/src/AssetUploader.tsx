import React, { useRef } from 'react';

const AssetUploader: React.FC = () => {
  const logoInput = useRef<HTMLInputElement>(null);
  const iconInput = useRef<HTMLInputElement>(null);
  const animationInput = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          localStorage.setItem(key, reader.result as string);
          window.location.reload(); // To update sidebar
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2>Upload Assets</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Logo: </label>
        <input type="file" accept="image/*" ref={logoInput} onChange={e => handleUpload(e, 'logo')} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Icon: </label>
        <input type="file" accept="image/*" ref={iconInput} onChange={e => handleUpload(e, 'icon')} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Animation Icon: </label>
        <input type="file" accept="image/*,image/gif" ref={animationInput} onChange={e => handleUpload(e, 'animation')} />
      </div>
      <div style={{ marginTop: 24 }}>
        <strong>Preview:</strong>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <img src={localStorage.getItem('logo') || '/src/assets/placeholder-logo.png'} alt="Logo" style={{ width: 48, height: 48, borderRadius: 8, background: '#eee' }} />
          <img src={localStorage.getItem('icon') || '/src/assets/placeholder-icon.png'} alt="Icon" style={{ width: 48, height: 48, borderRadius: 8, background: '#eee' }} />
          <img src={localStorage.getItem('animation') || '/src/assets/placeholder-animation.gif'} alt="Animation" style={{ width: 48, height: 48, borderRadius: 8, background: '#eee' }} />
        </div>
      </div>
    </div>
  );
};

export default AssetUploader; 