// src/Schools.ts
export type School = {
  id: number;
  schoolName: string;
  username: string;
  password: string;
};

const schools: School[] = [
  { id: 1, schoolName: "ABC Public School", username: "abc_admin", password: "abc123" },
  { id: 2, schoolName: "XYZ International School", username: "xyz_admin", password: "xyz456" }
];

export default schools;
