
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const internshipSchema = z.object({
  companyName: z.string().describe('The name of the company offering the internship.'),
  title: z.string().describe('The title of the internship role.'),
  location: z.string().describe('The location of the internship (e.g., "Mumbai", "Remote").'),
  description: z.string().describe('A brief description of the internship.'),
  requiredSkills: z.array(z.string()).describe('A list of skills required for the role.'),
  compensation: z.string().describe('The compensation or stipend for the internship.'),
});

const DocumentSchema = z.object({
  dataUri: z.string(),
  mimeType: z.string(),
}).optional();

const StudentProfileSchema = z.object({
  name: z.string().optional(),
  age: z.coerce.number().optional(),
  skills: z.string().optional().describe('A comma-separated list of the student\'s skills.'),
  qualifications: z.string().optional().describe('The student\'s educational qualifications.'),
  interests: z.string().optional().describe('The student\'s interests.'),
  experience: z.string().optional().describe('The student\'s past experience.'),
  locationPreference: z.string().optional().describe('The student\'s preferred location for an internship.'),
  // Documents
  resume: DocumentSchema.describe("The student's resume."),
  govtId: DocumentSchema.describe("The student's government-issued ID."),
  educationCertificate: DocumentSchema.describe("The student's educational certificate."),
  addressProof: DocumentSchema.describe("The student's address proof document."),
  incomeCertificate: DocumentSchema.describe("The student's income certificate."),
});


const MatchInternshipsInputSchema = z.object({
  studentProfile: StudentProfileSchema,
});
export type MatchInternshipsInput = z.infer<typeof MatchInternshipsInputSchema>;

export const MatchInternshipsOutputSchema = z.array(internshipSchema);
export type MatchInternshipsOutput = z.infer<typeof MatchInternshipsOutputSchema>;

export async function matchInternships(input: MatchInternshipsInput): Promise<MatchInternshipsOutput> {
  return matchInternshipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'internshipMatcherPrompt',
  input: { schema: MatchInternshipsInputSchema },
  output: { schema: MatchInternshipsOutputSchema },
  prompt: `You are an expert AI internship matching engine for the PM Internship Scheme.
Your task is to find and suggest internships for a student based on their profile.

You MUST strictly adhere to the following eligibility criteria. If the student does not meet these, you must return an empty list.
- Must be an Indian citizen. (Assume this is true if not specified otherwise)
- Age must be between 21 and 24.
- Minimum qualification: Class 10 / ITI / Polytechnic / Diploma / Graduate degree.
- Should not be employed full-time or enrolled in a full-time academic programme. (Assume this is true unless their experience indicates full-time employment)
- Students from premier institutes (IITs, IIMs, NIDs, IISERs, NITs, NLUs, etc.) are NOT eligible.
- Holders of higher/professional qualifications (MBA, PhD, CA, CS, MBBS, etc.) are NOT eligible.
- Candidates with family income above ₹8 lakh/year are NOT eligible.
- Students whose parents/spouse are permanent govt/PSU employees are NOT eligible.

Use the provided documents to verify the student's eligibility. Cross-reference the information in the documents with the student's profile and the eligibility criteria.
- **Govt ID:** Verify age and citizenship.
- **Educational Certificate:** Verify qualifications. Do not recommend if they are from a premier institute or have higher qualifications.
- **Income Certificate:** Verify family income is not above ₹8 lakh/year.
- **Resume:** Check for current full-time employment.

Based on the student's skills, qualifications, interests, and location preference, provide a list of 5-10 suitable internship openings from a mock database of available internships in India.
Ensure the suggested internships are diverse and relevant to the student's profile.

**Student Profile:**
- Name: {{{studentProfile.name}}}
- Age: {{{studentProfile.age}}}
- Skills: {{{studentProfile.skills}}}
- Qualifications: {{{studentProfile.qualifications}}}
- Interests: {{{studentProfile.interests}}}
- Experience: {{{studentProfile.experience}}}
- Location Preference: {{{studentProfile.locationPreference}}}

**Verification Documents:**
- Resume: {{#if studentProfile.resume}}{{media url=studentProfile.resume.dataUri mimeType=studentProfile.resume.mimeType}}{{else}}Not Provided{{/if}}
- Government ID: {{#if studentProfile.govtId}}{{media url=studentProfile.govtId.dataUri mimeType=studentProfile.govtId.mimeType}}{{else}}Not Provided{{/if}}
- Educational Certificate: {{#if studentProfile.educationCertificate}}{{media url=studentProfile.educationCertificate.dataUri mimeType=studentProfile.educationCertificate.mimeType}}{{else}}Not Provided{{/if}}
- Address Proof: {{#if studentProfile.addressProof}}{{media url=studentProfile.addressProof.dataUri mimeType=studentProfile.addressProof.mimeType}}{{else}}Not Provided{{/if}}
- Income Certificate: {{#if studentProfile.incomeCertificate}}{{media url=studentProfile.incomeCertificate.dataUri mimeType=studentProfile.incomeCertificate.mimeType}}{{else}}Not Provided{{/if}}
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
