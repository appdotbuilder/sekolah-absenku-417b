import { serial, text, pgTable, timestamp, integer, pgEnum, date, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums for PostgreSQL
export const userRoleEnum = pgEnum('user_role', ['admin', 'guru', 'siswa']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['hadir', 'izin', 'sakit', 'alpha']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'disetujui', 'ditolak']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  role: userRoleEnum('role').notNull(),
  nama: text('nama').notNull(),
  email: text('email'), // Nullable for students who login with NIS
  username: text('username'), // Optional for admin login
  nis: text('nis'), // Unique, nullable - for students only
  nip: text('nip'), // Unique, nullable - for teachers only
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraints
  uniqueEmail: unique('unique_email').on(table.email),
  uniqueNis: unique('unique_nis').on(table.nis),
  uniqueNip: unique('unique_nip').on(table.nip),
}));

// Kelas (Classes) table
export const kelasTable = pgTable('kelas', {
  id: serial('id').primaryKey(),
  nama_kelas: text('nama_kelas').notNull(),
  tingkatan: integer('tingkatan').notNull(), // Grade level (10, 11, 12)
  wali_kelas_id: integer('wali_kelas_id'), // Foreign key to users table, nullable
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Siswa (Students) table
export const siswaTable = pgTable('siswa', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  kelas_id: integer('kelas_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Guru (Teachers) table
export const guruTable = pgTable('guru', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Absensi (Attendance) table
export const absensiTable = pgTable('absensi', {
  id: serial('id').primaryKey(),
  siswa_id: integer('siswa_id').notNull(),
  tanggal: date('tanggal').notNull(), // Date only (YYYY-MM-DD)
  waktu_masuk: timestamp('waktu_masuk', { withTimezone: true }), // Check-in timestamp, nullable
  waktu_pulang: timestamp('waktu_pulang', { withTimezone: true }), // Check-out timestamp, nullable
  status: attendanceStatusEnum('status').notNull().default('alpha'),
  catatan: text('catatan'), // Notes, nullable
  guru_id: integer('guru_id'), // Teacher who managed the attendance, nullable
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint for one attendance record per student per day
  uniqueStudentDate: unique('unique_student_date').on(table.siswa_id, table.tanggal),
}));

// Izin (Leave/Sick Requests) table
export const izinTable = pgTable('izin', {
  id: serial('id').primaryKey(),
  siswa_id: integer('siswa_id').notNull(),
  tanggal: date('tanggal').notNull(), // Date of leave/sickness
  alasan: text('alasan').notNull(), // Reason for leave/sickness
  status_verifikasi: verificationStatusEnum('status_verifikasi').notNull().default('pending'),
  diverifikasi_oleh: integer('diverifikasi_oleh'), // Who verified the request, nullable
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  // User can be a student
  siswa: one(siswaTable, {
    fields: [usersTable.id],
    references: [siswaTable.user_id],
  }),
  // User can be a teacher
  guru: one(guruTable, {
    fields: [usersTable.id],
    references: [guruTable.user_id],
  }),
  // User can be a homeroom teacher (wali_kelas)
  kelasAsWaliKelas: many(kelasTable),
  // User can verify leave requests
  verifiedIzin: many(izinTable),
  // Teacher can manage attendance records
  managedAttendance: many(absensiTable),
}));

export const kelasRelations = relations(kelasTable, ({ one, many }) => ({
  // Class has a homeroom teacher (wali_kelas)
  waliKelas: one(usersTable, {
    fields: [kelasTable.wali_kelas_id],
    references: [usersTable.id],
  }),
  // Class has many students
  siswa: many(siswaTable),
}));

export const siswaRelations = relations(siswaTable, ({ one, many }) => ({
  // Student belongs to a user
  user: one(usersTable, {
    fields: [siswaTable.user_id],
    references: [usersTable.id],
  }),
  // Student belongs to a class
  kelas: one(kelasTable, {
    fields: [siswaTable.kelas_id],
    references: [kelasTable.id],
  }),
  // Student has many attendance records
  absensi: many(absensiTable),
  // Student can have many leave requests
  izin: many(izinTable),
}));

export const guruRelations = relations(guruTable, ({ one }) => ({
  // Teacher belongs to a user
  user: one(usersTable, {
    fields: [guruTable.user_id],
    references: [usersTable.id],
  }),
}));

export const absensiRelations = relations(absensiTable, ({ one }) => ({
  // Attendance belongs to a student
  siswa: one(siswaTable, {
    fields: [absensiTable.siswa_id],
    references: [siswaTable.id],
  }),
  // Attendance can be managed by a teacher
  guru: one(usersTable, {
    fields: [absensiTable.guru_id],
    references: [usersTable.id],
  }),
}));

export const izinRelations = relations(izinTable, ({ one }) => ({
  // Leave request belongs to a student
  siswa: one(siswaTable, {
    fields: [izinTable.siswa_id],
    references: [siswaTable.id],
  }),
  // Leave request can be verified by a user (teacher or admin)
  verifiedBy: one(usersTable, {
    fields: [izinTable.diverifikasi_oleh],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Kelas = typeof kelasTable.$inferSelect;
export type NewKelas = typeof kelasTable.$inferInsert;

export type Siswa = typeof siswaTable.$inferSelect;
export type NewSiswa = typeof siswaTable.$inferInsert;

export type Guru = typeof guruTable.$inferSelect;
export type NewGuru = typeof guruTable.$inferInsert;

export type Absensi = typeof absensiTable.$inferSelect;
export type NewAbsensi = typeof absensiTable.$inferInsert;

export type Izin = typeof izinTable.$inferSelect;
export type NewIzin = typeof izinTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  kelas: kelasTable,
  siswa: siswaTable,
  guru: guruTable,
  absensi: absensiTable,
  izin: izinTable,
};