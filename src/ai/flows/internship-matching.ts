
'use server';
/**
 * @fileOverview An AI agent for matching students with internships based on their profile and uploaded documents.
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

const StudentProfileSchema = z.object({
  name: z.string().optional(),
  age: z.coerce.number().optional(),
  skills: z.string().optional(),
  qualifications: z.string().optional(),
  interests: z.string().optional(),
  experience: z.string().optional(),
  locationPreference: z.string().optional(),
  resume: fileSchema,
  govtId: fileSchema,
  educationCertificate: fileSchema,
  addressProof: fileSchema,
  incomeCertificate: fileSchema,
});


export const MatchInternshipsInputSchema = z.object({
  studentProfile: StudentProfileSchema,
});

export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

const internshipSchema = z.object({
  companyName: z.string(),
  title: z.string(),
  location: z.string(),
  description: z.string(),
  requiredSkills: z.array(z.string()),
  compensation: z.string(),
});

export const MatchInternshipsOutputSchema = z.array(internshipSchema);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;


export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
    return matchInternshipsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'internshipMatcherPrompt',
  input: { schema: MatchInternshipsInputSchema },
  output: { schema: MatchInternshipsOutputSchema },
  prompt: `You are an expert AI career counselor for the PM Internship Scheme. Your goal is to match a student with relevant internship opportunities.

  STRICTLY follow these eligibility criteria for the PM Internship Scheme:
  - The candidate must be an Indian citizen.
  - Age must be between 21 and 24.
  - Minimum qualification: Class 10 / ITI / Polytechnic / Diploma / Graduate degree.
  - The candidate should not be employed full-time or enrolled in a full-time academic programme.
  - Students from premier institutes (IITs, IIMs, NIDs, IISERs, NITs, NLUs, etc.) are NOT eligible.
  - Holders of higher/professional qualifications (MBA, PhD, CA, CS, MBBS, etc.) are NOT eligible.
  - Students already enrolled in other govt apprenticeship/internship schemes (like NAPS, NATS) are NOT eligible.
  - Candidates with family income above ₹8 lakh/year are NOT eligible.
  - Students whose parents/spouse are permanent govt/PSU employees are NOT eligible.

  You will be given the student's profile information, including required documents for verification.
  1.  First, you MUST verify the student's eligibility based on their profile data AND the provided documents. Cross-reference the information in the documents (Aadhaar, educational certificates, income certificate) with the eligibility criteria.
  2.  If the student is NOT eligible, you MUST return an empty array.
  3.  If the student IS eligible, generate a list of 5 diverse, realistic, and relevant internship postings that would be a good fit for their skills, qualifications, and interests.
  4.  Ensure the generated internships are not from premier companies that would typically hire from the excluded premier institutes. Focus on small to medium-sized enterprises (SMEs), local businesses, and startups.
  5.  Vary the required skills and locations to provide a good range of options.

  Student Profile:
  - Name: {{{studentProfile.name}}}
  - Age: {{{studentProfile.age}}}
  - Skills: {{{studentProfile.skills}}}
  - Qualifications: {{{studentProfile.qualifications}}}
  - Interests: {{{studentProfile.interests}}}
  - Experience: {{{studentprofile.experience}}}
  - Location Preference: {{{studentProfile.locationPreference}}}

  Verification Documents:
  - Govt ID: {{media url=(or studentProfile.govtId.dataUri "")}}
  - Education Certificate: {{media url=(or studentProfile.educationCertificate.dataUri "")}}
  - Address Proof: {{media url=(or studentProfile.addressProof.dataUri "")}}
  - Income Certificate: {{media url=(or studentProfile.incomeCertificate.dataUri "")}}
  - Resume: {{media url=(or studentProfile.resume.dataUri "")}}

  Generate the list of internships now.
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
