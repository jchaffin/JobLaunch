import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  serial,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const resumes = pgTable("resumes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(),
  tags: text("tags").array().default([]),
  industry: text("industry"),
  jobLevel: text("job_level"),
  description: text("description"),
  parsedData: jsonb("parsed_data").$type<{
    summary: string;
    skills: string[];
    experience: Array<{
      company: string;
      role: string;
      duration: string;
      startDate?: Date;
      endDate?: Date;
      isCurrentRole?: boolean;
      location?: string;
      description?: string;
      achievements: string[];
      responsibilities: string[];
      keywords: string[];
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field?: string;
      year: string;
      gpa?: string;
      honors?: string;
    }>;
    contact: {
      email?: string;
      phone?: string;
      name?: string;
      title?: string;
      location?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
    ats_score: string;
    ats_recommendations: string[];
    tailoring_notes?: {
      keyChanges?: string[];
      keywordsAdded?: string[];
      focusAreas?: string[];
    };
  }>(),
  isActive: text("is_active").default("true"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forward declare the table types to avoid circular dependencies
const interviewSessions = pgTable("interview_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  sessionName: text("session_name").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  transcription: jsonb("transcription").default([]),
  suggestions: jsonb("suggestions").default([]),
  jobDescription: text("job_description"),
  jobUrl: text("job_url"),
  companyName: text("company_name"),
  roleTitle: text("role_title"),
  interviewType: text("interview_type"),
  customInstructions: text("custom_instructions"),
  skillFocus: text("skill_focus").array(),
  resumeId: varchar("resume_id").references(() => resumes.id),
  status: text("status").default("setup"),
});

export const prepSessions = pgTable("prep_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  interviewId: varchar("interview_id").references(() => interviewSessions.id),
  conversation: jsonb("conversation")
    .$type<
      Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: number;
      }>
    >()
    .default([]),
  insights: jsonb("insights").$type<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    practiceAreas: string[];
  }>(),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Re-export the interview sessions table
export { interviewSessions };

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  fileName: true,
  fileContent: true,
  parsedData: true,
});

export const insertPrepSessionSchema = createInsertSchema(prepSessions).pick({
  userId: true,
  interviewId: true,
  conversation: true,
});

export const insertSessionSchema = createInsertSchema(interviewSessions).pick({
  sessionName: true,
  userId: true,
  jobDescription: true,
  jobUrl: true,
  companyName: true,
  roleTitle: true,
  interviewType: true,
  customInstructions: true,
  skillFocus: true,
  resumeId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertPrepSession = z.infer<typeof insertPrepSessionSchema>;
export type PrepSession = typeof prepSessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;

// WebSocket message types
export const websocketMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("audio_chunk"),
    data: z.string(), // base64 encoded audio
  }),
  z.object({
    type: z.literal("start_recording"),
  }),
  z.object({
    type: z.literal("stop_recording"),
  }),
  z.object({
    type: z.literal("set_interview_context"),
    data: z.object({
      companyName: z.string().optional(),
      roleTitle: z.string().optional(),
      interviewType: z.string().optional(),
      jobDescription: z.string().optional(),
      skillFocus: z.array(z.string()).optional(),
      customInstructions: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("transcription"),
    data: z.object({
      text: z.string(),
      timestamp: z.number(),
      speaker: z.enum(["interviewer", "user"]),
    }),
  }),
  z.object({
    type: z.literal("suggestion"),
    data: z.object({
      text: z.string(),
      keyPoints: z.array(z.string()),
      estimatedDuration: z.string(),
      confidence: z.number(),
    }),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;

// Additional type exports for components
export type ParsedResume = Resume["parsedData"];

// Job description types
export const jobDescriptions = pgTable("job_descriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  analysis: jsonb("analysis").$type<{
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    qualifications: string[];
    experience: string;
    company: string;
    role: string;
    sentiment: number;
    experienceLevel: string;
    requiredYears: number;
    location: string;
    workType: string;
    companyInfo: string;
    keywords: string[];
    strongPoints?: string[];
    missingSkills?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type JobAnalysis = JobDescription["analysis"];

// Education data tables
export const degrees = pgTable("degrees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  level: text("level").notNull(), // "associate", "bachelor", "master", "doctoral", "certificate"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // "university", "college", "community_college", "technical", "online", "international"
  location: text("location"), // City, State/Country
  formatted_address: text("formatted_address"), // Google Maps formatted address
  latitude: real("latitude"), // Geographic latitude
  longitude: real("longitude"), // Geographic longitude
  city: text("city"), // Extracted city name
  state: text("state"), // Extracted state code
  country: text("country"), // Country name
  place_id: text("place_id"), // Google Maps Place ID
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Degree = typeof degrees.$inferSelect;
export type Institution = typeof institutions.$inferSelect;

// Job applications table
export const jobApplications = pgTable("job_applications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  jobUrl: text("job_url").notNull(),
  status: text("status").notNull().default("applied"), // "applied", "in-progress", "rejected", "offered"
  appliedDate: timestamp("applied_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
  location: text("location"),
  salaryRange: text("salary_range"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobApplicationSchema = createInsertSchema(
  jobApplications,
).omit({
  id: true,
  appliedDate: true,
  lastUpdated: true,
  createdAt: true,
});

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
