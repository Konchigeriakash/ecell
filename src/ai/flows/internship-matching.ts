
'use server';
/**
 * @fileOverview An AI-powered internship matching flow.
 *
 * - matchInternships - A function that finds suitable internships based on a student's profile.
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
  email: z.string().optional(),
  phone: z.string().optional(),
  age: z.coerce.number().optional(),
  address: z.string().optional(),
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


export const internshipSchema = z.object({
  companyName: z.string().describe('The name of the company offering the internship.'),
  title: z.string().describe('The title of the internship role.'),
  location: z.string().describe('The location of the internship (e.g., "Mumbai", "Remote").'),
  description: z.string().describe('A brief description of the internship.'),
  requiredSkills: z.array(z.string()).describe('A list of skills required for the internship.'),
  compensation: z.string().describe('The stipend or compensation for the internship (e.g., "₹10,000/month", "Unpaid").'),
});

export const MatchInternshipsInputSchema = z.object({
    studentProfile: StudentProfileSchema,
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

export const MatchInternshipsOutputSchema = z.array(internshipSchema);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;


const prompt = ai.definePrompt({
    name: 'internshipMatchingPrompt',
    input: { schema: MatchInternshipsInputSchema },
    output: { schema: MatchInternshipsOutputSchema },
    prompt: `
    You are an advanced AI engine for the "PM Internship Scheme," a government initiative to connect Indian youth with internships. Your primary function is to act as a matching engine.

    First, generate a diverse list of 5-7 fictional but realistic internship opportunities available in India. These should cover various sectors like IT, Marketing, Finance, and include different locations (e.g., Bangalore, Delhi, Remote).

    Next, you will receive the profile of a student applicant. Your main goal is to find the best internship matches for this student from the list you just generated.

    You must strictly adhere to the following PM Internship Scheme eligibility rules when matching:
    - The student's age must be between 21 and 24.
    - The student should not be employed full-time.
    - The student should not hold higher professional qualifications like MBA, PhD, etc.
    - The student's qualifications (like B.Tech, B.Com, Diploma) make them eligible.

    Analyze the student's profile, including their skills, qualifications, interests, and location preference. The profile may also contain uploaded documents for verification. Use all this information to decide if the student is eligible for the scheme.

    - If the student is NOT ELIGIBLE for the scheme based on the rules, you MUST return an empty array [].
    - If the student IS ELIGIBLE, you must return a list of the top 3-4 most suitable internships from the list you generated. The suitability should be based on the match between the student's skills/interests and the internship requirements.

    Student Profile:
    - Name: {{{studentProfile.name}}}
    - Age: {{{studentProfile.age}}}
    - Qualifications: {{{studentProfile.qualifications}}}
    - Skills: {{{studentProfile.skills}}}
    - Interests: {{{studentProfile.interests}}}
    - Experience: {{{studentProfile.experience}}}
    - Location Preference: {{{studentProfile.locationPreference}}}

    If documents are provided, consider them for verification. For example, a degree certificate confirms their qualifications. However, do not reject a candidate solely because a document is missing if other profile information confirms their eligibility. Your primary job is to match eligible candidates to relevant roles.
  `,
});

const internshipMatchingFlow = ai.defineFlow(
  {
    name: 'internshipMatchingFlow',
    inputSchema: MatchInternshipsInputSchema,
    outputSchema: MatchInternshipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
    return await internshipMatchingFlow(input);
}
