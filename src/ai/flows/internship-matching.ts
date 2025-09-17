
'use server';
/**
 * @fileOverview An internship matching AI agent.
 *
 * - matchInternships - A function that handles the internship matching process.
 * - MatchInternshipsInput - The input type for the matchInternships function.
 * - MatchInternshipsOutput - The return type for the matchInternships function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchInternshipsInputSchema = z.object({
  skills: z.array(z.string()).describe('The skills of the student.'),
  interests: z.array(z.string()).describe('The interests of the student.'),
  location: z.string().describe('The preferred location of the student.'),
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

const MatchInternshipsOutputSchema = z.array(
  z.object({
    companyName: z.string().describe('The name of the company.'),
    title: z.string().describe('The title of the internship.'),
    location: z.string().describe('The location of the internship.'),
    description: z.string().describe('A brief description of the internship.'),
    requiredSkills: z.array(z.string()).describe('The skills required for the internship.'),
    compensation: z.string().describe('The compensation for the internship (e.g., "₹8,000/month", "Unpaid", "Performance-based").'),
  })
);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;


const prompt = ai.definePrompt({
  name: 'internshipMatchingPrompt',
  input: { schema: MatchInternshipsInputSchema },
  output: { schema: MatchInternshipsOutputSchema },
  prompt: `You are an expert internship matching engine for the PM Internship Scheme. Your primary role is to find suitable internships for students based on their skills, interests, and location, while strictly adhering to the scheme's eligibility criteria.

  Do not suggest an internship if the candidate is not eligible.

  Here are the rules for eligibility:
  - The candidate must be an Indian citizen.
  - Their age must be between 21 and 24.
  - They must have a minimum qualification of Class 10, ITI, Polytechnic, Diploma, or a Graduate degree.
  - They must not be employed full-time or enrolled in a full-time academic program.

  Here are the disqualification criteria (who cannot apply):
  - Students from premier institutes (e.g., IITs, IIMs, NITs).
  - Holders of higher/professional qualifications (e.g., MBA, PhD, CA).
  - Students already enrolled in other government internship schemes.
  - Candidates with a family income above ₹8 lakh/year.
  - Students whose parents/spouse are permanent government/PSU employees.

  Based on the user's input, generate a list of 5 diverse and realistic internship opportunities that would be a good fit. Ensure the internships are from a variety of fields and located in the specified area. The internships should seem realistic for the Indian job market.

  Student's Skills: {{{skills}}}
  Student's Interests: {{{interests}}}
  Student's Location: {{{location}}}
  `,
});

const matchInternshipsFlow = ai.defineFlow(
  {
    name: 'matchInternshipsFlow',
    inputSchema: MatchInternshipsInputSchema,
    outputSchema: MatchInternshipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
  return await matchInternshipsFlow(input);
}
