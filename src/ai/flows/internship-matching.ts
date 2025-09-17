
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { internshipSchema } from '../schema/internship-schema';

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
  resume: z.string().describe("Data URI of the student's resume.").optional(),
  govtId: z.string().describe("Data URI of the student's government ID.").optional(),
  educationCertificate: z.string().describe("Data URI of the student's education certificate.").optional(),
  addressProof: z.string().describe("Data URI of the student's address proof.").optional(),
  incomeCertificate: z.string().describe("Data URI of the student's income certificate.").optional(),
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


const matchInternshipsFlow = ai.defineFlow(
  {
    name: 'matchInternshipsFlow',
    inputSchema: MatchInternshipsInputSchema,
    outputSchema: MatchInternshipsOutputSchema,
  },
  async (input) => {

    const prompt = ai.definePrompt({
      name: 'internshipMatchPrompt',
      input: { schema: MatchInternshipsInputSchema },
      output: { schema: MatchInternshipsOutputSchema },
      prompt: `
        You are an AI assistant for the "PM Internship Scheme". 
        Your primary role is to find and recommend relevant internship opportunities for a student based on their profile, while strictly adhering to the scheme's eligibility criteria.

        **Student Profile:**
        - Name: {{studentProfile.name}}
        - Age: {{studentProfile.age}}
        - Location Preference: {{studentProfile.locationPreference}}
        - Skills: {{studentProfile.skills}}
        - Interests: {{studentProfile.interests}}
        - Qualifications: {{studentProfile.qualifications}}
        - Experience: {{studentProfile.experience}}
        - Resume: {{media url=studentProfile.resume}}
        - Government ID: {{media url=studentProfile.govtId}}
        - Education Certificate: {{media url=studentProfile.educationCertificate}}
        - Address Proof: {{media url=studentProfile.addressProof}}
        - Income Certificate: {{media url=studentProfile.incomeCertificate}}

        **Eligibility & Guidelines – PM Internship Scheme:**

        **Who Can Apply:**
        - Must be an Indian citizen.
        - Age between 21 – 24 years.
        - Minimum qualification: Class 10 / ITI / Polytechnic / Diploma / Graduate degree.
        - Should not be employed full-time or enrolled in a full-time academic programme.

        **Who Cannot Apply:**
        - Students from premier institutes (IITs, IIMs, NIDs, IISERs, NITs, NLUs, etc.).
        - Holders of higher/professional qualifications (MBA, PhD, CA, CS, MBBS, etc.).
        - Students already enrolled in other govt apprenticeship/internship schemes (like NAPS, NATS).
        - Candidates with family income above ₹8 lakh/year.
        - Students whose parents/spouse are permanent govt/PSU employees (except contractual staff).

        **Your Task:**
        1.  **VERIFY ELIGIBILITY:** Carefully analyze the student's profile information and the content of their uploaded documents (Resume, ID, Certificates) against ALL eligibility criteria. 
        2.  **STRICT ENFORCEMENT:** If the student fails to meet even a single "Who Can Apply" rule, or if they fall under any "Who Cannot Apply" category, you MUST NOT recommend any internships. In this case, return an empty array.
        3.  **DOCUMENT CROSS-REFERENCE:** Use the information from the documents to validate the student's stated qualifications, age, and other details. For example, check the date of birth on the ID to verify age. Check the education certificate to verify qualifications.
        4.  **MATCHING:** If the student is fully eligible, generate a list of 5-10 diverse, realistic, and relevant internship opportunities that match their skills, interests, and location preferences.
        5.  **GENERATE REALISTIC DATA:** Populate the internship data with realistic company names (mix of startups and established companies), titles, descriptions, skills, and compensation. Do not use placeholder text. Ensure the output format is a valid JSON array of internship objects.
    `});

    const { output } = await prompt(input);
    return output!;
  }
);

    