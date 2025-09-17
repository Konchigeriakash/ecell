
'use server';
/**
 * @fileOverview An internship matching AI agent.
 *
 * - matchInternships - A function that handles the internship matching process.
 * - MatchInternshipsInput - The input type for the matchInternships function.
 * - MatchInternshipsOutput - The return type for the matchInternships function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const internshipSchema = z.object({
  companyName: z.string().describe('The name of the company offering the internship.'),
  title: z.string().describe('The title of the internship position.'),
  location: z.string().describe('The location of the internship (e.g., city, remote).'),
  description: z.string().describe('A brief description of the internship.'),
  requiredSkills: z.array(z.string()).describe('A list of skills required for the internship.'),
  compensation: z.string().describe('The compensation or stipend for the internship.'),
});

const FileSchema = z.object({
  dataUri: z.string(),
  mimeType: z.string(),
}).optional();

const StudentProfileSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    age: z.coerce.number().optional(),
    address: z.string().optional(),
    skills: z.string().optional(),
    qualifications: z.string().optional(),
    interests: z.string().optional(),
    experience: z.string().optional(),
    locationPreference: z.string().optional(),
    resume: FileSchema,
    govtId: FileSchema,
    educationCertificate: FileSchema,
    addressProof: FileSchema,
    incomeCertificate: FileSchema,
  });

const MatchInternshipsInputSchema = z.object({
  studentProfile: StudentProfileSchema,
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

const MatchInternshipsOutputSchema = z.array(internshipSchema);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;


const prompt = ai.definePrompt({
  name: 'internshipMatcherPrompt',
  input: { schema: MatchInternshipsInputSchema },
  output: { schema: MatchInternshipsOutputSchema },
  prompt: `You are an expert internship matching engine for the PM Internship Scheme. Your primary goal is to find suitable internships for students based on their profile, while strictly adhering to the scheme's eligibility criteria.

  You MUST ONLY recommend internships if the student meets ALL the following criteria. Verify against their profile details and uploaded documents:

  Eligibility Criteria:
  - Must be an Indian citizen.
  - Age between 21 – 24 years.
  - Minimum qualification: Class 10 / ITI / Polytechnic / Diploma / Graduate degree.
  - Should not be employed full-time or enrolled in a full-time academic programme.
  - Family income must NOT be above ₹8 lakh/year.
  - Parents/spouse are NOT permanent govt/PSU employees.
  - Is NOT a student from a premier institute (IITs, IIMs, NIDs, IISERs, NITs, NLUs, etc.).
  - Does NOT hold higher/professional qualifications (MBA, PhD, CA, CS, MBBS, etc.).

  Use the student's documents to verify their eligibility.
  - Aadhaar or Govt ID: {{#if studentProfile.govtId}}{{media url=studentProfile.govtId.dataUri}}{{else}}Not Provided{{/if}}
  - Educational certificates: {{#if studentProfile.educationCertificate}}{{media url=studentProfile.educationCertificate.dataUri}}{{else}}Not Provided{{/if}}
  - Address proof: {{#if studentProfile.addressProof}}{{media url=studentProfile.addressProof.dataUri}}{{else}}Not Provided{{/if}}
  - Income certificate: {{#if studentProfile.incomeCertificate}}{{media url=studentProfile.incomeCertificate.dataUri}}{{else}}Not Provided{{/if}}

  Based on the student's profile, skills, interests, and location preference, suggest a list of 5-10 suitable internships from a simulated list of available positions. Ensure the suggested internships are diverse. Do not invent internships that are not on the list.

  Student Profile:
  - Name: {{studentProfile.name}}
  - Age: {{studentProfile.age}}
  - Skills: {{studentProfile.skills}}
  - Interests: {{studentProfile.interests}}
  - Qualifications: {{studentProfile.qualifications}}
  - Location Preference: {{studentProfile.locationPreference}}
  - Experience: {{studentProfile.experience}}
  - Resume: {{#if studentProfile.resume}}{{media url=studentProfile.resume.dataUri}}{{else}}Not Provided{{/if}}

  If the student is ineligible for any reason, return an empty list.

  Generate a list of internships in the specified JSON format.
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
