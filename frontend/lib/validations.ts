import { z } from 'zod';

// Password must have: 8+ chars, uppercase, lowercase, number, special char
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)');

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email address is required')
  .max(254, 'Email address must be less than 254 characters')
  .email('Please enter a valid email address')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Email must include a valid domain');

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .max(30, 'Phone number must be less than 30 characters')
  .regex(/^\+?[0-9\s().-]+$/, 'Phone number can only contain numbers, spaces, +, -, and parentheses')
  .refine((phone) => {
    const digitCount = phone.replace(/\D/g, '').length;
    return digitCount >= 7 && digitCount <= 15;
  }, 'Phone number must contain 7 to 15 digits');

export const registerProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required').max(120, 'Full name must be less than 120 characters'),
  phone: phoneSchema,
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters').max(500, 'Bio must be less than 500 characters'),
});

export const registerAccountSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['student', 'landlord'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const registerSchema = registerProfileSchema.and(registerAccountSchema);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  location: z.string().min(1, 'Location is required').max(255, 'Location must be less than 255 characters'),
  property_type: z.enum(['apartment', 'house', 'room', 'condo', 'townhouse'], {
    errorMap: () => ({ message: 'Please select a property type' }),
  }),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  square_feet: z.number().int().min(0).optional(),
  amenities: z.array(z.string()).max(20, 'Maximum 20 amenities allowed').optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional(),
});

export const reportSchema = z.object({
  reason: z.string().min(1, 'Please provide a reason for the report'),
});

export const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: phoneSchema.optional().or(z.literal('')),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterProfileFormData = z.infer<typeof registerProfileSchema>;
export type RegisterAccountFormData = z.infer<typeof registerAccountSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ListingFormData = z.infer<typeof listingSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
