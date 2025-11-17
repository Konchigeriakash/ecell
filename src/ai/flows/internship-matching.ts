
'use server';
/**
 * @fileOverview An AI flow for matching students with internships.
 *
 * - matchInternships - A function that handles the internship matching process.
 * - MatchInternshipsInput - The input type for the matchInternships function.
 * - MatchInternshipsOutput - The return type for the matchInternships function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const fileSchema = z.object({
  dataUri: z.string(),
  mimeType: z.string(),
}).optional();

export const StudentProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  age: z.coerce.number().optional(),
  address: z.string().optional(),
  skills: z.string().optional(),
  qualifications: z.string().optional(),
  interests: z.string().optional(),
  experience: z.string().optional(),
  locationPreference: z.string().optional(),
  // Document fields
  resume: fileSchema,
  govtId: fileSchema,
  educationCertificate: fileSchema,
  addressProof: fileSchema,
  incomeCertificate: fileSchema,
});


export const InternshipSchema = z.object({
  companyName: z.string().describe('The name of the company offering the internship.'),
  title: z.string().describe('The title of the internship role.'),
  location: z.string().describe('The location of the internship (e.g., city or "Remote").'),
  description: z.string().describe('A brief description of the internship.'),
  requiredSkills: z.array(z.string()).describe('A list of skills required for the role.'),
  compensation: z.string().describe('The stipend or compensation for the internship (e.g., "₹10,000/month", "Unpaid", "Performance-based").'),
});

const MatchInternshipsInputSchema = z.object({
  studentProfile: StudentProfileSchema,
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

export const MatchInternshipsOutputSchema = z.array(InternshipSchema);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;

export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
  const prompt = ai.definePrompt({
    name: 'internshipMatchingPrompt',
    input: { schema: MatchInternshipsInputSchema },
    output: { schema: MatchInternshipsOutputSchema },
    prompt: `You are an expert career counselor and AI matching engine for a government internship platform. Your task is to generate a list of 5-7 diverse, fictional internship opportunities that are highly relevant to the provided student profile.

Analyze the student's skills, qualifications, interests, and location preferences. Then, create a set of realistic and appealing internship listings that would be a great fit for them.

Here is the student's profile:
- Name: {{{studentProfile.name}}}
- Skills: {{{studentProfile.skills}}}
- Qualifications: {{{studentProfile.qualifications}}}
- Interests: {{{studentProfile.interests}}}
- Experience: {{{studentProfile.experience}}}
- Location Preference: {{{studentProfile.locationPreference}}}

Generate a variety of roles from different fictional companies. Ensure the internships have clear titles, locations (respecting the student's preference, including remote options), descriptions, required skills, and compensation details.
`,
  });

  const internshipMatchingFlow = ai.defineFlow(
    {
      name: 'internshipMatchingFlow',
      inputSchema: MatchInternshipsInputSchema,
      outputSchema: MatchInternshipsOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      return output!;
    }
  );

  return await internshipMatchingFlow(input);
}
