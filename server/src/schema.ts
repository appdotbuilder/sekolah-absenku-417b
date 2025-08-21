import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['admin', 'guru', 'siswa']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Attendance status enum
export const attendanceStatusSchema = z.enum(['hadir', 'izin', 'sakit', 'alpha']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

// Leave verification status enum
export const verificationStatusSchema = z.enum(['pending', 'disetujui', 'ditolak']);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  role: userRoleSchema,
  nama: z.string(),
  email: z.string().nullable(),
  username: z.string().nullable(),
  nis: z.string().nullable(),
  nip: z.string().nullable(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Kelas (Class) schema
export const kelasSchema = z.object({
  id: z.number(),
  nama_kelas: z.string(),
  tingkatan: z.number().int(),
  wali_kelas_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Kelas = z.infer<typeof kelasSchema>;

// Siswa (Student) schema
export const siswaSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  kelas_id: z.number(),
  created_at: z.coerce.date()
});

export type Siswa = z.infer<typeof siswaSchema>;

// Guru (Teacher) schema
export const guruSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type Guru = z.infer<typeof guruSchema>;

// Absensi (Attendance) schema
export const absensiSchema = z.object({
  id: z.number(),
  siswa_id: z.number(),
  tanggal: z.string(), // Date as string in YYYY-MM-DD format
  waktu_masuk: z.coerce.date().nullable(),
  waktu_pulang: z.coerce.date().nullable(),
  status: attendanceStatusSchema,
  catatan: z.string().nullable(),
  guru_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Absensi = z.infer<typeof absensiSchema>;

// Izin (Leave Request) schema
export const izinSchema = z.object({
  id: z.number(),
  siswa_id: z.number(),
  tanggal: z.string(), // Date as string in YYYY-MM-DD format
  alasan: z.string(),
  status_verifikasi: verificationStatusSchema,
  diverifikasi_oleh: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Izin = z.infer<typeof izinSchema>;

// Input schemas for authentication
export const loginInputSchema = z.object({
  role: userRoleSchema,
  identifier: z.string(), // Can be email, username, nis, or nip
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schemas for creating users
export const createUserInputSchema = z.object({
  role: userRoleSchema,
  nama: z.string().min(1),
  email: z.string().email().optional(),
  username: z.string().optional(),
  nis: z.string().optional(),
  nip: z.string().optional(),
  password: z.string().min(6),
  kelas_id: z.number().optional() // Only for students
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schemas for updating users
export const updateUserInputSchema = z.object({
  id: z.number(),
  nama: z.string().min(1).optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string().min(6).optional(),
  kelas_id: z.number().optional() // Only for students
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Input schemas for creating classes
export const createKelasInputSchema = z.object({
  nama_kelas: z.string().min(1),
  tingkatan: z.number().int().min(1).max(12),
  wali_kelas_id: z.number().optional()
});

export type CreateKelasInput = z.infer<typeof createKelasInputSchema>;

// Input schemas for updating classes
export const updateKelasInputSchema = z.object({
  id: z.number(),
  nama_kelas: z.string().min(1).optional(),
  tingkatan: z.number().int().min(1).max(12).optional(),
  wali_kelas_id: z.number().nullable().optional()
});

export type UpdateKelasInput = z.infer<typeof updateKelasInputSchema>;

// Input schemas for attendance check-in
export const checkInInputSchema = z.object({
  siswa_id: z.number()
});

export type CheckInInput = z.infer<typeof checkInInputSchema>;

// Input schemas for attendance check-out
export const checkOutInputSchema = z.object({
  siswa_id: z.number()
});

export type CheckOutInput = z.infer<typeof checkOutInputSchema>;

// Input schemas for updating attendance status (by teacher)
export const updateAttendanceInputSchema = z.object({
  id: z.number(),
  status: attendanceStatusSchema,
  catatan: z.string().optional(),
  guru_id: z.number()
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceInputSchema>;

// Input schemas for creating leave requests
export const createIzinInputSchema = z.object({
  siswa_id: z.number(),
  tanggal: z.string(), // Date as string in YYYY-MM-DD format
  alasan: z.string().min(1)
});

export type CreateIzinInput = z.infer<typeof createIzinInputSchema>;

// Input schemas for verifying leave requests
export const verifyIzinInputSchema = z.object({
  id: z.number(),
  status_verifikasi: verificationStatusSchema.exclude(['pending']),
  diverifikasi_oleh: z.number()
});

export type VerifyIzinInput = z.infer<typeof verifyIzinInputSchema>;

// Query schemas for reports
export const reportFilterSchema = z.object({
  kelas_id: z.number().optional(),
  siswa_id: z.number().optional(),
  start_date: z.string().optional(), // Date as string in YYYY-MM-DD format
  end_date: z.string().optional(), // Date as string in YYYY-MM-DD format
  status: attendanceStatusSchema.optional()
});

export type ReportFilter = z.infer<typeof reportFilterSchema>;

// Response schemas for authentication
export const authResponseSchema = z.object({
  success: z.boolean(),
  user: userSchema.optional(),
  message: z.string().optional(),
  token: z.string().optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Response schemas for attendance statistics
export const attendanceStatsSchema = z.object({
  total_days: z.number(),
  hadir: z.number(),
  izin: z.number(),
  sakit: z.number(),
  alpha: z.number(),
  percentage_hadir: z.number(),
  percentage_absent: z.number()
});

export type AttendanceStats = z.infer<typeof attendanceStatsSchema>;