import * as z from "zod";

export const orderFormSchema = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(50000),
  category: z.string().min(1),
  orderType: z.string().min(1),
  budget: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0),
  deadline: z.string().min(1),
  pages: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0)),
  format: z.string().optional(),
  citationStyle: z.string().optional(),
  language: z.string().optional(),
  additionalNotes: z.string().trim().max(1000).optional(),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;