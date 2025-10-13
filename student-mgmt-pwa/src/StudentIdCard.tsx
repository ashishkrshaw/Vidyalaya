import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, Typography, Avatar, Button, Stack } from '@mui/material';
import PhotoIcon from '@mui/icons-material/Photo';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { QRCodeCanvas } from 'qrcode.react';
import { loadPrincipalSignature } from './db';

interface StudentIdCardProps {
  student: {
    name: string;
    class: string;
    section: string;
    rollNo: string;
    fatherName: string;
    address: string;
    parentMobile: string;
    photo?: string;
    id?: string;
    gender?: string;
  };
  onUpdatePhoto?: (photo: string) => void;
  onGenerateId?: () => void;
}

const StudentIdCard: React.FC<StudentIdCardProps> = ({ student, onUpdatePhoto, onGenerateId }) => {
  const [photo, setPhoto] = useState<string | undefined>(student.photo);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSignature() {
      const sig = await loadPrincipalSignature();
      if (sig) {
        if (typeof sig !== 'string' && sig.type?.startsWith('image/')) {
          setSignatureUrl(URL.createObjectURL(sig));
        } else if (typeof sig === 'string') {
          setSignatureUrl(sig);
        }
      }
    }
    fetchSignature();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target?.result as string);
        onUpdatePhoto?.(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Download card as PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    const node = cardRef.current;
    // Use html2canvas for rendering
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(node, { scale: 2 });
    const link = document.createElement('a');
    link.download = `student-id-${student.id || 'card'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <Card ref={cardRef}
        elevation={6}
        sx={{
          width: { xs: 320, sm: 506, md: 506 },
          height: { xs: 200, sm: 319, md: 319 },
          maxWidth: 506,
          maxHeight: 319,
          aspectRatio: '1.586',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
          color: '#222',
          position: 'relative',
          overflow: 'hidden',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <CardMembershipIcon sx={{ fontSize: 32, color: '#3b4cca' }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: '#3b4cca', letterSpacing: 1 }}>Student ID Card</Typography>
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={photo} sx={{ width: 80, height: 80, border: '2px solid #3b4cca', bgcolor: photo ? 'transparent' : '#e0e7ef' }}>
              {!photo && <PhotoIcon sx={{ fontSize: 40, color: '#3b4cca' }} />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>{student.name}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Student ID: <span style={{ fontWeight: 700 }}>{student.id || '0123456789'}</span></Typography>
              <Typography variant="body2">Class: {student.class} | {student.gender || 'N/A'}</Typography>
              <Typography variant="body2">Father: {student.fatherName}</Typography>
              <Typography variant="body2">Phone: {student.parentMobile}</Typography>
              <Typography variant="body2">Session: {new Date().getFullYear()}-{new Date().getFullYear()+1}</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ px: 3, pb: 1, display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="caption" sx={{ fontWeight: 500, color: '#3b4cca', mb: 0.5 }}>Authorized Signature</Typography>
            <Box sx={{ width: 80, height: 24, borderBottom: '1px solid #3b4cca', mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {signatureUrl ? (
                <img src={signatureUrl} alt="Principal Signature" style={{ maxHeight: 24, maxWidth: 80, objectFit: 'contain' }} />
              ) : null}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <QRCodeCanvas
              value={
                JSON.stringify({
                  id: student.id || '0123456789',
                  name: student.name,
                  class: student.class,
                  section: student.section,
                  rollNo: student.rollNo,
                  gender: student.gender || 'N/A'
                })
              }
              size={64}
              bgColor="#f8fafc"
              fgColor="#3b4cca"
              style={{ borderRadius: 8 }}
            />
            <Typography variant="caption" sx={{ fontSize: 10, color: '#3b4cca', mt: 0.5 }}>Scan for details</Typography>
          </Box>
        </Box>
      </Card>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" component="label" sx={{ borderRadius: 2 }}>
          {photo ? 'Change Photo' : 'Upload Photo'}
          <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
        </Button>
        <Button variant="contained" color="primary" sx={{ borderRadius: 2 }} onClick={onGenerateId} disabled={!photo}>
          Generate/Update Student ID
        </Button>
        <Button variant="contained" color="secondary" sx={{ borderRadius: 2 }} onClick={handleDownload}>
          Download Card
        </Button>
      </Box>
    </Box>
  );
};

export default StudentIdCard;
