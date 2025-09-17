
'use server';
/**
 * @fileOverview An AI-powered internship matching engine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StudentProfileSchema = z.object({
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
  resume: z.string().optional().describe("A data URI of the student's resume. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  govtId: z.string().optional().describe("A data URI of the student's government ID. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  educationCertificate: z.string().optional().describe("A data URI of the student's education certificate. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  addressProof: z.string().optional().describe("A data URI of the student's address proof. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  incomeCertificate: z.string().optional().describe("A data URI of the student's income certificate. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

const MatchInternshipsInputSchema = z.object({
  studentProfile: StudentProfileSchema,
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

const internshipSchema = z.object({
    companyName: z.string().describe('The name of the company offering the internship.'),
    title: z.string().describe('The title of the internship position.'),
    location: z.string().describe('The location of the internship (e.g., city, "Remote").'),
    description: z.string().describe('A brief description of the internship.'),
    requiredSkills: z.array(z.string()).describe('A list of skills required for the role.'),
    compensation: z.string().describe('The stipend or compensation for the internship (e.g., "₹5,000/month", "Unpaid").'),
});

const MatchInternshipsOutputSchema = z.array(internshipSchema);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;


export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
    return matchInternshipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'internshipMatchingPrompt',
  input: { schema: MatchInternshipsInputSchema },
  output: { schema: MatchInternshipsOutputSchema },
  prompt: `You are an expert AI internship matching engine for the "PM Internship Scheme".
Your goal is to find relevant internships for the provided student.
You MUST strictly adhere to the scheme's eligibility criteria.

## PM Internship Scheme Guidelines ##

### Who Can Apply
- Must be an Indian citizen.
- Age between 21 – 24 years.
- Minimum qualification: Class 10 / ITI / Polytechnic / Diploma / Graduate degree.
- Should not be employed full-time or enrolled in a full-time academic programme.

### Who Cannot Apply
- Students from premier institutes (IITs, IIMs, NIDs, IISERs, NITs, NLUs, etc.).
- Holders of higher/professional qualifications (MBA, PhD, CA, CS, MBBS, etc.).
- Students already enrolled in other govt apprenticeship / internship schemes (like NAPS, NATS).
- Candidates with family income above ₹8 lakh/year.
- Students whose parents/spouse are permanent govt/PSU employees (except contractual staff).

## Instructions ##
1.  **Verify Eligibility:** Analyze the student's profile, including their age, qualifications, and any uploaded documents (like income certificate or ID) to confirm they meet ALL eligibility criteria. If a document is provided, use it as the source of truth. For example, use the income certificate to validate the family income. Use the education certificate to validate their qualifications and institute type.
2.  **Filter Ineligible Candidates:** If the student is clearly ineligible based on the rules (e.g., age is 25, qualification is MBA, income is over ₹8 lakh), you MUST return an empty array.
3.  **Match Skills and Interests:** If the student is eligible, find 5-10 highly relevant internship opportunities from a simulated pool of available internships in India. Match based on the student's skills, interests, and location preference.
4.  **Generate Realistic Data:** The internship data you generate should be diverse and realistic.

## Student Profile ##
- **Name:** {{studentProfile.name}}
- **Age:** {{studentProfile.age}}
- **Skills:** {{studentProfile.skills}}
- **Interests:** {{studentProfile.interests}}
- **Qualifications:** {{studentProfile.qualifications}}
- **Location Preference:** {{studentProfile.locationPreference}}
- **Experience:** {{studentProfile.experience}}

## Document Analysis ##
- **Resume:** {{media url=studentProfile.resume}}
- **Government ID:** {{media url=studentProfile.govtId}}
- **Education Certificate:** {{media url=student.educationCertificate}}
- **Address Proof:** {{media url=student.addressProof}}
- **Income Certificate:** {{media url=student.incomeCertificate}}

Based on this complete analysis, provide a list of suitable internships.
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
