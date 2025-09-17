
'use server';
/**
 * @fileOverview An AI flow for matching students with internships.
 *
 * This file defines the Genkit flow for the internship matching feature.
 * It takes a student's profile and returns a list of suitable internships.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';


const internshipSchema = z.object({
    companyName: z.string(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    compensation: z.string(),
    requiredSkills: z.array(z.string()),
});

const FileSchema = z.object({
    dataUri: z.string().describe("A data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
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


export const MatchInternshipsInputSchema = z.object({
    studentProfile: StudentProfileSchema,
});

export const MatchInternshipsOutputSchema = z.array(internshipSchema);

export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;

export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
  return matchInternshipsFlow(input);
}

const prompt = ai.definePrompt({
    name: 'internshipMatcherPrompt',
    input: { schema: MatchInternshipsInputSchema },
    output: { schema: MatchInternshipsOutputSchema },
    prompt: `You are an expert AI internship matching engine for the Indian Government's PM Internship Scheme.
    Your task is to analyze the provided student profile and suggest a list of 5 relevant internships from a fictional database.

    **CRITICAL ELIGIBILITY RULES - DO NOT VIOLATE:**
    The student MUST meet ALL of the following criteria. If not, you MUST return an empty list.
    1.  **Age:** Must be between 21 and 24.
    2.  **Qualifications:** Must have at least a Class 10, ITI, Polytechnic, or Diploma. They CANNOT have higher/professional degrees like MBA, PhD, CA, CS, MBBS.
    3.  **Employment:** Must not be currently employed full-time or enrolled in a full-time academic program.
    4.  **Income:** Family income must NOT be above ₹8 lakh/year.
    5.  **Exclusions:** Cannot be from premier institutes (IITs, IIMs, NIDs, etc.) and their parents/spouse cannot be permanent government/PSU employees.

    **VERIFICATION PROCESS:**
    You have been provided with the student's documents. You MUST use these documents as the source of truth to verify their eligibility against the rules above.
    -   **Resume/CV:** Check for current full-time employment or enrollment in excluded institutions.
    -   **Government ID:** Verify age.
    -   **Educational Certificate:** Verify qualifications.
    -   **Address Proof:** For context.
    -   **Income Certificate:** Verify family income.

    **STUDENT PROFILE & DOCUMENTS:**
    -   **Name:** {{{studentProfile.name}}}
    -   **Age:** {{{studentProfile.age}}}
    -   **Skills:** {{{studentProfile.skills}}}
    -   **Qualifications:** {{{studentProfile.qualifications}}}
    -   **Interests:** {{{studentProfile.interests}}}
    -   **Experience:** {{{studentProfile.experience}}}
    -   **Location Preference:** {{{studentProfile.locationPreference}}}

    {{#if studentProfile.resume}}
    -   **Resume:** {{media url=studentProfile.resume.dataUri}}
    {{/if}}
    {{#if studentProfile.govtId}}
    -   **Government ID:** {{media url=studentProfile.govtId.dataUri}}
    {{/if}}
    {{#if studentProfile.educationCertificate}}
    -   **Educational Certificate:** {{media url=studentProfile.educationCertificate.dataUri}}
    {{/if}}
    {{#if studentProfile.addressProof}}
    -   **Address Proof:** {{media url=studentProfile.addressProof.dataUri}}
    {{/if}}
    {{#if studentProfile.incomeCertificate}}
    -   **Income Certificate:** {{media url=studentProfile.incomeCertificate.dataUri}}
    {{/if}}

    If the student is eligible, generate a list of 5 diverse, fictional internships that match their skills, interests, and location preference. Ensure the internships are realistic for the scheme (e.g., avoid roles requiring extremely high qualifications).
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
