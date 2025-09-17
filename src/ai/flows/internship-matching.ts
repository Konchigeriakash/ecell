
'use server';
/**
 * @fileOverview Internship matching AI flow.
 *
 * This file defines the AI flow for matching students with internships based on their profile,
 * skills, and uploaded documents, adhering to the PM Internship Scheme guidelines.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';


// Define the Zod schema for a single file upload
const FileSchema = z.object({
    dataUri: z.string().describe("The base64 encoded data URI of the file."),
    mimeType: z.string().describe("The MIME type of the file (e.g., 'application/pdf').")
}).optional();


// Define the Zod schema for the student's profile, including documents
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


// Input schema for the matching flow
const MatchInternshipsInputSchema = z.object({
  studentProfile: StudentProfileSchema,
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

// Output schema for the matching flow
const InternshipSchema = z.object({
  companyName: z.string(),
  title: z.string(),
  location: z.string(),
  description: z.string(),
  requiredSkills: z.array(z.string()),
  compensation: z.string(),
});
export type MatchInternshipsOutput = z.infer<typeof InternshipSchema>[];


export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
    
    // Define the prompt inside the function to avoid top-level object errors
    const prompt = ai.definePrompt(
        {
            name: 'internshipMatchingPrompt',
            input: { schema: MatchInternshipsInputSchema },
            output: { schema: z.array(InternshipSchema) },
            prompt: `You are an expert AI internship matching engine for the PM Internship Scheme.
Your goal is to find suitable internships for a student based on their profile.
Crucially, you must ONLY recommend internships if the student meets the scheme's strict eligibility criteria.

**Eligibility Criteria (PM Internship Scheme):**
- **Who Can Apply:**
  - Indian citizen.
  - Age: 21–24 years.
  - Minimum qualification: Class 10 / ITI / Polytechnic / Diploma / Graduate degree.
  - Not employed full-time or in a full-time academic programme.
- **Who CANNOT Apply:**
  - Students from premier institutes (IITs, IIMs, NIDs, etc.).
  - Holders of higher/professional qualifications (MBA, PhD, CA, etc.).
  - Enrolled in other govt internship schemes.
  - Family income above ₹8 lakh/year.
  - Parents/spouse are permanent govt/PSU employees.

**Your Task:**
1.  **Analyze the student's profile, including their uploaded documents, to verify their eligibility against the criteria above.**
    - Use the 'age' field to check the age criteria.
    - Use 'qualifications' and the 'educationCertificate' to check educational background.
    - Use the 'incomeCertificate' to check the family income.
    - If a document is missing, note it, but you can still proceed if other data strongly suggests eligibility.
2.  **If the student is ELIGIBLE:**
    - Generate a list of 3-5 diverse, fictional internship postings that are a great match for the student's skills, interests, and location preference.
    - For each internship, provide: companyName, title, location, a brief description, requiredSkills (array of strings), and compensation (e.g., "₹15,000/month", "Unpaid", "Performance-based stipend").
3.  **If the student is NOT ELIGIBLE:**
    - Return an EMPTY list. Do not generate any internships.

**Student Profile:**
- **Name:** {{{studentProfile.name}}}
- **Age:** {{{studentProfile.age}}}
- **Skills:** {{{studentProfile.skills}}}
- **Interests:** {{{studentProfile.interests}}}
- **Qualifications:** {{{studentProfile.qualifications}}}
- **Location Preference:** {{{studentProfile.locationPreference}}}

**Uploaded Documents for Verification:**
- **Resume:** {{#if studentProfile.resume}}{{media url=(lookup studentProfile.resume 'dataUri') mimeType=(lookup studentProfile.resume 'mimeType')}}{{else}}Not Provided{{/if}}
- **Government ID:** {{#if studentProfile.govtId}}{{media url=(lookup studentProfile.govtId 'dataUri') mimeType=(lookup studentProfile.govtId 'mimeType')}}{{else}}Not Provided{{/if}}
- **Education Certificate:** {{#if studentProfile.educationCertificate}}{{media url=(lookup studentProfile.educationCertificate 'dataUri') mimeType=(lookup studentProfile.educationCertificate 'mimeType')}}{{else}}Not Provided{{/if}}
- **Address Proof:** {{#if studentProfile.addressProof}}{{media url=(lookup studentProfile.addressProof 'dataUri') mimeType=(lookup studentProfile.addressProof 'mimeType')}}{{else}}Not Provided{{/if}}
- **Income Certificate:** {{#if studentProfile.incomeCertificate}}{{media url=(lookup studentProfile.incomeCertificate 'dataUri') mimeType=(lookup studentProfile.incomeCertificate 'mimeType')}}{{else}}Not Provided{{/if}}

Based on this, provide the internship matches in the specified output format.
`,
        },
    );

    // Define the flow inside the function
    const internshipMatchingFlow = ai.defineFlow(
      {
        name: 'internshipMatchingFlow',
        inputSchema: MatchInternshipsInputSchema,
        outputSchema: z.array(InternshipSchema),
      },
      async (flowInput) => {
        const { output } = await prompt(flowInput);
        return output || [];
      }
    );

    return await internshipMatchingFlow(input);
}
