import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePortalBase } from "@/hooks/usePortalBase";
import { Clock } from "lucide-react";

type WeeklySlot = {
  _id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export interface MentorProps {
  id: string;
  name: string;
  title: string;
  subjects: string[];
  rating: number;
  hourlyRate: number;
  image: string;
  availability?: WeeklySlot[];
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MentorCard: React.FC<MentorProps> = ({
  id,
  name,
  title,
  subjects,
  rating,
  hourlyRate,
  image,
  availability,
}) => {
  const base = usePortalBase();

  const sub = subjects?.map((subject) => subject.class_id.class);
 



  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link to={`${base}/mentors/${id}`}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={image || "/og-image.png"}
            alt={name}
            className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
          />
          {/* <div className="absolute top-4 right-4 bg-white/90 rounded-full px-2 py-1 text-sm font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700" className="w-4 h-4 mr-1">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            {rating}
          </div> */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="text-white text-xl font-bold truncate">
              {name?.toUpperCase()}
            </h3>
            <p className="text-white/90 text-sm truncate">{title}</p>
          </div>
        </div>
      </Link>
      <CardContent className="p-4 pt-5">
        <div className="flex flex-wrap gap-2 mb-3">
          {sub?.slice(0, 3).map((subject, index) => (
            <Badge key={index} variant="secondary" className="font-normal">
              {subject}
            </Badge>
          ))}
          {sub.length > 3 && (
            <Badge variant="outline" className="font-normal">
              +{subjects.length - 3} more
            </Badge>
          )}
        </div>
        {(() => {
          const active = (availability ?? []).filter(
            (el) => el.isActive !== false,
          );
          if (active.length === 0) return null;
          const days = [1, 2, 3, 4, 5, 6, 0]
            .filter((d) => active.some((el) => el.dayOfWeek === d))
            .map((d) => DAY_SHORT[d]);
          return (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Available {days.join(", ")}</span>
            </div>
          );
        })()}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/mentors/${id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Profile
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default MentorCard;
