import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  loginInputSchema,
  createUserInputSchema,
  updateUserInputSchema,
  createKelasInputSchema,
  updateKelasInputSchema,
  checkInInputSchema,
  checkOutInputSchema,
  updateAttendanceInputSchema,
  createIzinInputSchema,
  verifyIzinInputSchema,
  reportFilterSchema,
  userRoleSchema
} from './schema';

// Import handlers
import { loginUser, createUser, validateToken } from './handlers/auth';
import { getUsers, getUserById, updateUser, deleteUser, getStudents, getTeachers } from './handlers/users';
import { getKelas, getKelasById, createKelas, updateKelas, deleteKelas, getKelasByTeacher, assignWaliKelas } from './handlers/kelas';
import {
  checkInStudent,
  checkOutStudent,
  updateAttendanceStatus,
  getAttendanceRecords,
  getTodayAttendance,
  getAttendanceStats,
  getStudentAttendanceHistory,
  getClassAttendanceByDate
} from './handlers/attendance';
import {
  createLeaveRequest,
  verifyLeaveRequest,
  getLeaveRequests,
  getPendingLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest
} from './handlers/leave_requests';
import {
  generateAttendanceReport,
  exportAttendanceToPDF,
  exportAttendanceToExcel,
  getDailyAttendanceSummary,
  getMonthlyAttendanceTrends,
  getStudentAttendanceReport
} from './handlers/reports';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  auth: router({
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => loginUser(input)),
    
    validateToken: publicProcedure
      .input(z.string())
      .query(({ input }) => validateToken(input)),
  }),

  // User management routes
  users: router({
    create: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => createUser(input)),
    
    getAll: publicProcedure
      .input(userRoleSchema.optional())
      .query(({ input }) => getUsers(input)),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getUserById(input)),
    
    update: publicProcedure
      .input(updateUserInputSchema)
      .mutation(({ input }) => updateUser(input)),
    
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteUser(input)),
    
    getStudents: publicProcedure
      .query(() => getStudents()),
    
    getTeachers: publicProcedure
      .query(() => getTeachers()),
  }),

  // Class management routes
  kelas: router({
    getAll: publicProcedure
      .query(() => getKelas()),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getKelasById(input)),
    
    create: publicProcedure
      .input(createKelasInputSchema)
      .mutation(({ input }) => createKelas(input)),
    
    update: publicProcedure
      .input(updateKelasInputSchema)
      .mutation(({ input }) => updateKelas(input)),
    
    delete: publicProcedure
      .input(z.number())
      .mutation(({ input }) => deleteKelas(input)),
    
    getByTeacher: publicProcedure
      .input(z.number())
      .query(({ input }) => getKelasByTeacher(input)),
    
    assignWaliKelas: publicProcedure
      .input(z.object({
        kelasId: z.number(),
        teacherId: z.number().nullable()
      }))
      .mutation(({ input }) => assignWaliKelas(input.kelasId, input.teacherId)),
  }),

  // Attendance management routes
  attendance: router({
    checkIn: publicProcedure
      .input(checkInInputSchema)
      .mutation(({ input }) => checkInStudent(input)),
    
    checkOut: publicProcedure
      .input(checkOutInputSchema)
      .mutation(({ input }) => checkOutStudent(input)),
    
    updateStatus: publicProcedure
      .input(updateAttendanceInputSchema)
      .mutation(({ input }) => updateAttendanceStatus(input)),
    
    getRecords: publicProcedure
      .input(reportFilterSchema)
      .query(({ input }) => getAttendanceRecords(input)),
    
    getTodayAttendance: publicProcedure
      .input(z.number())
      .query(({ input }) => getTodayAttendance(input)),
    
    getStats: publicProcedure
      .input(reportFilterSchema)
      .query(({ input }) => getAttendanceStats(input)),
    
    getStudentHistory: publicProcedure
      .input(z.object({
        siswaId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      }))
      .query(({ input }) => getStudentAttendanceHistory(input.siswaId, input.startDate, input.endDate)),
    
    getClassAttendanceByDate: publicProcedure
      .input(z.object({
        kelasId: z.number(),
        tanggal: z.string()
      }))
      .query(({ input }) => getClassAttendanceByDate(input.kelasId, input.tanggal)),
  }),

  // Leave request management routes
  leaveRequests: router({
    create: publicProcedure
      .input(createIzinInputSchema)
      .mutation(({ input }) => createLeaveRequest(input)),
    
    verify: publicProcedure
      .input(verifyIzinInputSchema)
      .mutation(({ input }) => verifyLeaveRequest(input)),
    
    getAll: publicProcedure
      .input(z.object({
        siswaId: z.number().optional(),
        status: z.string().optional()
      }))
      .query(({ input }) => getLeaveRequests(input.siswaId, input.status)),
    
    getPending: publicProcedure
      .input(z.number().optional())
      .query(({ input }) => getPendingLeaveRequests(input)),
    
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getLeaveRequestById(input)),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        alasan: z.string()
      }))
      .mutation(({ input }) => updateLeaveRequest(input.id, input.alasan)),
    
    delete: publicProcedure
      .input(z.object({
        id: z.number(),
        siswaId: z.number()
      }))
      .mutation(({ input }) => deleteLeaveRequest(input.id, input.siswaId)),
  }),

  // Reporting routes
  reports: router({
    generateAttendanceReport: publicProcedure
      .input(reportFilterSchema)
      .query(({ input }) => generateAttendanceReport(input)),
    
    exportToPDF: publicProcedure
      .input(reportFilterSchema)
      .mutation(({ input }) => exportAttendanceToPDF(input)),
    
    exportToExcel: publicProcedure
      .input(reportFilterSchema)
      .mutation(({ input }) => exportAttendanceToExcel(input)),
    
    getDailySummary: publicProcedure
      .input(z.object({
        tanggal: z.string(),
        kelasId: z.number().optional()
      }))
      .query(({ input }) => getDailyAttendanceSummary(input.tanggal, input.kelasId)),
    
    getMonthlyTrends: publicProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(),
        kelasId: z.number().optional()
      }))
      .query(({ input }) => getMonthlyAttendanceTrends(input.year, input.month, input.kelasId)),
    
    getStudentReport: publicProcedure
      .input(z.object({
        siswaId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      }))
      .query(({ input }) => getStudentAttendanceReport(input.siswaId, input.startDate, input.endDate)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      // Configure CORS for the frontend
      cors({
        origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
        credentials: true,
      })(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });

  server.listen(port);
  console.log(`🚀 Sekolah Absenku tRPC server listening at port: ${port}`);
  console.log(`📊 Database timezone: Asia/Jakarta (GMT+7)`);
  console.log(`🔒 Authentication: JWT with bcrypt password hashing`);
  console.log(`📁 API endpoints: /trpc`);
}

// Start the server
start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});