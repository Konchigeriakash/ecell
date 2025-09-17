
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Upload, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];


const fileSchema = z.object({
    dataUri: z.string(),
    mimeType: z.string(),
  }).optional();

const formSchema = z.object({
  name: z.string().min(1, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  age: z.coerce.number().min(16, "You must be at least 16 years old.").max(100),
  address: z.string().min(1, "Please enter your address."),
  skills: z.string().min(1, "Please enter at least one skill."),
  qualifications: z.string().min(1, "Please enter your qualifications."),
  interests: z.string().min(1, "Please enter at least one interest."),
  experience: z.string().optional(),
  locationPreference: z.string().min(1, "Please enter your location preference."),
  // Document fields
  resume: fileSchema,
  govtId: fileSchema,
  educationCertificate: fileSchema,
  addressProof: fileSchema,
  incomeCertificate: fileSchema,
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfileForm() {
  const [profile, setProfile] = useLocalStorage('user-profile', {
    name: '',
    email: '',
    phone: '',
    age: '',
    address: '',
    skills: '',
    qualifications: '',
    interests: '',
    experience: '',
    locationPreference: '',
  });

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: profile,
  });

  // Helper to convert file to data URI and get mime type
  const processFile = (file: File): Promise<{ dataUri: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_FILE_SIZE) {
        return reject(new Error('Max file size is 5MB.'));
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        return reject(new Error('Only .jpg, .png and .pdf formats are supported.'));
      }

      const reader = new FileReader();
      reader.onload = () => resolve({ dataUri: reader.result as string, mimeType: file.type });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };


  const onSubmit = async (data: FormValues) => {
    const profileData: any = { ...data };

    try {
        // Handle file conversions
        for (const key of ['resume', 'govtId', 'educationCertificate', 'addressProof', 'incomeCertificate']) {
            const file = data[key as keyof FormValues] as unknown as File;
            if (file instanceof File) {
                profileData[key] = await processFile(file);
            }
        }
        
        setProfile(profileData);
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        });
    } catch (error: any) {
        toast({
          variant: "destructive",
          title: "File Upload Error",
          description: error.message,
        });
    }
  };

  const renderFileInput = (name: keyof FormValues, label: string, description: string) => (
     <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="file" 
                            accept={ACCEPTED_FILE_TYPES.join(",")}
                            onChange={(e) => field.onChange(e.target.files?.[0])} 
                            className="w-full"
                        />
                         <Button type="button" variant="outline" size="icon">
                            <Upload className="h-4 w-4"/>
                        </Button>
                    </div>
                </FormControl>
                <FormDescription>{description}</FormDescription>
                <FormMessage />
            </FormItem>
        )}
    />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Edit Your Information</CardTitle>
        <CardDescription>This information will be used to find matching internships.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Priya Kumar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., priya.kumar@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 21" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 123, Main Street, Bangalore, 560001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="qualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualifications</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., B.Tech in Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Skills</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., React, Python, Data Analysis" {...field} />
                  </FormControl>
                   <FormDescription>Comma-separated skills.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Interests</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AI, Healthcare, Fintech" {...field} />
                  </FormControl>
                   <FormDescription>Comma-separated interests.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="locationPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Preference</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bangalore, Remote" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your past projects or work experience." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center gap-2"><FileText /> Documents</h3>
                <p className="text-sm text-muted-foreground">
                    Upload the required documents for verification. Max file size: 5MB. Accepted formats: PDF, JPG, PNG.
                </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                {renderFileInput("resume", "Resume", "Your latest resume.")}
                {renderFileInput("govtId", "Aadhaar or Govt ID", "Aadhaar card or other valid government-issued ID.")}
                {renderFileInput("educationCertificate", "Educational Certificate", "Latest marksheet, diploma, or degree certificate.")}
                {renderFileInput("addressProof", "Address Proof", "Ration card, Voter ID, etc.")}
                {renderFileInput("incomeCertificate", "Income Certificate", "Required to validate income criteria.")}
            </div>

            <Button type="submit">Save Profile</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
