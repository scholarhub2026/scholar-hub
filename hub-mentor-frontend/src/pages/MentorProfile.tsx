import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PortalPage from "@/components/layout/PortalPage";
import { usePortalBase } from "@/hooks/usePortalBase";
import { mentors } from "@/data/mentors";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";
import { TutorData } from "@/types/mentors";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AvailabilitySlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

/** Active slots grouped by weekday (Mon-first), each sorted by start time. */
const groupByDay = (slots: AvailabilitySlot[] = []) =>
  [1, 2, 3, 4, 5, 6, 0]
    .map((day) => ({
      day: DAY_SHORT[day],
      slots: slots
        .filter((s) => s.isActive !== false && s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter((g) => g.slots.length > 0);

const MentorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const base = usePortalBase();
  const [mentor, setMentor] = useState<TutorData | undefined>(undefined);



  const { data, isSuccess, isLoading } = useGetMentorQuery({ id });
  const isAvailable=data?.data?.is_available;


  useEffect(() => {
    console.log(data?.data?.selected_class);
    if (isSuccess) {
      setMentor(data.data);
    }
  }, [data]);

  const stripBullets = (html) => {
    return html?.replace(/<ul>/g, "") // remove <ul>
      .replace(/<\/ul>/g, "")
      .replace(/<li>/g, "<p>• ") // convert <li> to paragraph with a dot
      .replace(/<\/li>/g, "</p>");
  };

  if (!mentor) {
    // Still resolving the mentor — show a spinner, not a "not found" flash.
    if (isLoading || data?.data) {
      return (
        <PortalPage>
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        </PortalPage>
      );
    }
    return (
      <PortalPage>
        <div className="container-wide py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Mentor not found</h2>
          <p className="text-muted-foreground mb-6">
            The mentor you're looking for doesn't exist or has been removed.
          </p>
          <Link to={`${base}/mentors`}>
            <Button>Back to Mentors</Button>
          </Link>
        </div>
      </PortalPage>
    );
  }

  const strippedDetails = stripBullets(mentor.additional_details);

  return (
    <PortalPage>
      <div className="container-wide py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mentor Info Column */}
          <div className="md:w-2/3">
            <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
              <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={mentor.profile_pic || "/og-image.png"}
                  alt={mentor.firstName + " " + mentor?.lastName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold capitalize">
                    {mentor.firstName&& mentor.firstName.toUpperCase()}{" "} {mentor.lastName&& mentor.lastName.toUpperCase()}
                  </h1>
                  <div className="flex items-center text-amber-500">
                    {/* <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg> */}
                    {/* <span className="ml-1 font-medium">{mentor.}</span>
                    <span className="ml-1 text-sm text-muted-foreground">({mentor.reviews.length} reviews)</span> */}
                  </div>
                </div>

                <h2 className="text-xl text-primary mb-3">
                  {mentor.education_qualification}
                </h2>
                <div>
                  {mentor.selected_class.length > 0 && (
                    <>
                      {/* Show all classes */}
                      <h3 className="text-md text-muted-foreground mb-3">
                        {mentor.selected_class.map((item, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="mr-2"
                          >
                            {item.class_id.class} - {item.class_id.syllabus}
                          </Badge>
                        ))}
                      </h3>

                      {/* Collect and show unique subjects */}
                      <h3 className="text-md text-muted-foreground mb-3">
                        {[
                          ...new Set(
                            mentor.selected_class.flatMap((item) =>
                              item.subject.map((sub) => sub.subject_id.name)
                            )
                          ),
                        ].map((subject, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-2 capitalize"
                          >
                            {subject}
                          </Badge>
                        ))}
                      </h3>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {/* {mentor.subjects.map((subject, index) => (
                    <Badge key={index} variant="secondary">
                      {subject}
                    </Badge>
                  ))} */}
                </div>

                {groupByDay(mentor.weekly_availability).length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Weekly availability
                    </div>
                    <div className="space-y-2">
                      {groupByDay(mentor.weekly_availability).map((g) => (
                        <div
                          key={g.day}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span className="w-9 shrink-0 text-sm font-semibold text-slate-500">
                            {g.day}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {g.slots.map((s, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="font-normal"
                              >
                                {s.startTime}–{s.endTime}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="about" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                {/* <TabsTrigger value="experience">Experience</TabsTrigger> */}
                {/* <TabsTrigger value="reviews">Reviews ({mentor.reviews.length})</TabsTrigger> */}
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <div
                  className="prose max-w-none ql-editor"
                  dangerouslySetInnerHTML={{
                    __html:
                      mentor.additional_details ||
                      "<p>No details provided.</p>",
                  }}
                />
              </TabsContent>

              <TabsContent value="experience">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Professional Experience
                  </h3>
                  <p className="text-muted-foreground">{mentor.experience}</p>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-mentor-light rounded-full">
                      {/* <div className="text-2xl font-bold text-primary">{mentor.rating}</div> */}
                    </div>
                    <div>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            // fill={i < Math.floor(mentor.rating) ? "#FFD700" : "#E5E7EB"}
                            className="h-5 w-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ))}
                      </div>
                      {/* <div className="text-sm text-muted-foreground">Based on {mentor.reviews.length} reviews</div> */}
                    </div>
                  </div>

                  {/* <div className="space-y-6">
                    {mentor.reviews.map((review) => (
                      <Card key={review.id} className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{review.user}</div>
                            <div className="text-sm text-muted-foreground">{review.date}</div>
                          </div>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={i < review.rating ? "#FFD700" : "#E5E7EB"}
                                className="h-4 w-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ))}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{review.text}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div> */}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Enquiry Column */}
          <div className="md:w-1/3 mt-8 md:mt-0">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Enquire about classes</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`${base}/booking/${mentor._id}`} className="w-full">
                  <button className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700">
                    Enquire Now
                  </button>
                </Link>
                <p className="mt-3 text-center text-xs text-slate-400">
                  No payment now — we'll contact you to arrange classes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalPage>
  );
};

export default MentorProfile;
