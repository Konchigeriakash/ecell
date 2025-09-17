
'use server';
/**
 * @fileOverview The AI-powered internship matching engine.
 *
 * - matchInternships - A function that handles the internship matching process.
 * - MatchInternshipsInput - The input type for the matchInternships function.
 * - MatchInternshipsOutput - The return type for the matchInternships function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';


// Internal schema for file uploads
const FileSchema = z.object({
  dataUri: z.string(),
  mimeType: z.string(),
}).optional();

// Input schema for the matching flow
const StudentProfileSchema = z.object({
  name: z.string().optional(),
  age: z.coerce.number().optional(),
  skills: z.string().optional(),
  qualifications: z.string().optional(),
  interests: z.string().optional(),
  locationPreference: z.string().optional(),
  experience: z.string().optional(),
  // Document fields
  resume: FileSchema,
  govtId: FileSchema,
  educationCertificate: FileSchema,
  addressProof: FileSchema,
  incomeCertificate: FileSchema,
});
export const MatchInternshipsInputSchema = z.object({
  studentProfile: StudentProfileSchema,
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

// Output schema for the matching flow
const InternshipSchema = z.object({
  companyName: z.string().describe('The name of the company offering the internship.'),
  title: z.string().describe('The title of the internship position.'),
  description: z.string().describe('A brief description of the internship.'),
  location: z.string().describe('The location of the internship (e.g., city, or "Remote").'),
  requiredSkills: z.array(z.string()).describe('A list of skills required for the internship.'),
  compensation: z.string().describe('The stipend or compensation for the internship.'),
});

export const MatchInternshipsOutputSchema = z.array(InternshipSchema);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;


export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
  const internshipMatchingFlow = ai.defineFlow(
    {
      name: 'internshipMatchingFlow',
      inputSchema: MatchInternshipsInputSchema,
      outputSchema: MatchInternshipsOutputSchema,
    },
    async (flowInput) => {
        
        const prompt = ai.definePrompt({
          name: 'internshipMatchingPrompt',
          input: { schema: MatchInternshipsInputSchema },
          output: { schema: MatchInternshipsOutputSchema },
          prompt: `You are an AI internship matching engine for the PM Internship Scheme.
Your task is to act as a matching engine that suggests internships to candidates based on their profile.
You MUST generate a list of 5 diverse, fictional internships from various fields like IT, Marketing, Management, and Design.

Then, you MUST evaluate the student's profile against the PM Internship Scheme rules.

Eligibility Rules:
- Age: 21-24 years.
- Qualifications: Minimum Class 10 / ITI / Polytechnic / Diploma / Graduate.
- Not employed full-time.
- Not in a premier institute (IIT, IIM, etc.).
- No higher qualifications (MBA, PhD, etc.).
- Family income not above ₹8 lakh/year.

Your primary goal is to provide internship suggestions. Do not reject a candidate for missing documents; just note it.
For each of the 5 generated internships, you will determine if the student is a good match based on their skills and the eligibility rules.
The final output should be a list of the generated internships that are a potential fit. Do not explain why a student is not eligible in the output. Simply return a list of potentially suitable internships.

Student Profile:
- Name: {{studentProfile.name}}
- Age: {{studentProfile.age}}
- Skills: {{studentProfile.skills}}
- Qualifications: {{studentProfile.qualifications}}
- Interests: {{studentProfile.interests}}
- Location Preference: {{studentProfile.locationPreference}}
- Experience: {{studentProfile.experience}}

- Resume: {{#if studentProfile.resume}}{{media url=studentProfile.resume.dataUri mimeType=studentProfile.resume.mimeType}}{{else}}Not provided{{/if}}
- Govt ID: {{#if studentProfile.govtId}}{{media url=studentProfile.govtId.dataUri mimeType=studentProfile.govtId.mimeType}}{{else}}Not provided{{/if}}
- Education Certificate: {{#if studentProfile.educationCertificate}}{{media url=studentProfile.educationCertificate.dataUri mimeType=studentProfile.educationCertificate.mimeType}}{{else}}Not provided{{/if}}
- Address Proof: {{#if studentProfile.addressProof}}{{media url=studentProfile.addressProof.dataUri mimeType=studentProfile.addressProof.mimeType}}{{else}}Not provided{{/if}}
- Income Certificate: {{#if studentProfile.incomeCertificate}}{{media url=studentProfile.incomeCertificate.dataUri mime-type=studentProfile.incomeCertificate.mimeType}}{{else}}Not provided{{/if}}
`,
        });

      const { output } = await prompt(flowInput);
      return output!;
    }
  );

  return await internshipMatchingFlow(input);
}
