
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, MapPin } from "lucide-react";
import { matchInternships, MatchInternshipsOutput } from "@/ai/flows/internship-matching";
import InternshipCard from "./internship-card";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSearchParams } from "next/navigation";

// Add matchScore to the output schema
type InternshipWithScore = MatchInternshipsOutput[number] & { matchScore?: number };

const formSchema = z.object({
  skills: z.string().min(1, "Please enter at least one skill."),
  interests: z.string().min(1, "Please enter at least one interest."),
  location: z.string().min(1, "Please enter a location."),
});

type FormValues = z.infer<typeof formSchema>;

export default function InternshipMatcher() {
  const searchParams = useSearchParams();
  const [profile] = useLocalStorage('user-profile', {});
  const [internships, setInternships] = useState<InternshipWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skills: "",
      interests: "",
      location: "",
    },
  });

  // Effect to populate form from localStorage
  useEffect(() => {
    if (profile.skills || profile.interests || profile.locationPreference) {
      form.reset({
        skills: profile.skills || "",
        interests: profile.interests || "",
        location: profile.locationPreference || "",
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setInternships([]);

    if (!profile.name) {
      toast({
        variant: "destructive",
        title: "Profile Incomplete",
        description: "Please complete your profile before matching internships.",
      });
      setIsLoading(false);
      return;
    }

    try {
      let result = await matchInternships({
        studentProfile: profile,
      });

      // Add a random match score for demonstration
      const resultWithScores = result.map(internship => ({
        ...internship,
        matchScore: Math.floor(Math.random() * (98 - 70 + 1)) + 70, // Random score between 70-98
      })).sort((a, b) => b.matchScore - a.matchScore); // Sort by score
      
      setInternships(resultWithScores);
    } catch (error: any) {
      console.error("Failed to match internships:", error);
      let description = "Could not fetch internship matches. Please try again.";
      if (error?.message?.includes('503 Service Unavailable')) {
          description = "The AI service is currently overloaded. Please try again in a few moments.";
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect for auto-search
  useEffect(() => {
    const autoSearch = searchParams.get('autoSearch') === 'true';
    const hasProfileData = profile.skills && profile.interests && profile.locationPreference;

    if (autoSearch && hasProfileData && !isLoading) {
        // We use form.getValues() to ensure we trigger the search with the data that's been set in the form
        const formValues = form.getValues();
        if(formValues.skills && formValues.interests && formValues.location) {
             onSubmit(formValues);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, profile, isLoading, form.getValues]);


  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Using a free, open reverse geocoding API
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            const city = data.address.city || data.address.town || data.address.village;
            const state = data.address.state;

            if (city && state) {
              const locationString = `${city}, ${state}`;
              form.setValue("location", locationString);
              toast({
                title: "Location Found",
                description: `Set location to ${locationString}.`,
              });
            } else {
               toast({
                variant: "destructive",
                title: "Location Error",
                description: "Could not determine your city from the coordinates.",
              });
            }
          } catch (error) {
             toast({
                variant: "destructive",
                title: "Location Error",
                description: "Failed to fetch city name.",
              });
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
          toast({
            variant: "destructive",
            title: "Geolocation Error",
            description: "Unable to retrieve your location. Please check your browser permissions.",
          });
        }
      );
    } else {
        toast({
            variant: "destructive",
            title: "Unsupported",
            description: "Geolocation is not supported by your browser.",
        });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Internship Search</CardTitle>
          <CardDescription>Use your profile data to find internships. The AI will verify your eligibility using your uploaded documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Skills (from profile)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., React, Python, Data Analysis" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Interests (from profile)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., AI, Healthcare, Fintech" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Location</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="e.g., Bangalore, Remote" {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={handleGeoLocation} disabled={isLocating}>
                        {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                         Use my location
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Find Internships
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Finding the best matches for you...</p>
        </div>
      )}

      {internships.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {internships.map((internship, index) => (
            <InternshipCard key={`${internship.companyName}-${index}`} internship={internship} />
          ))}
        </div>
      )}

      {!isLoading && internships.length === 0 && (
         <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Your internship matches will appear here.</p>
         </div>
      )}
    </div>
  );
}

    