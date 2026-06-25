import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useGetSubjectQuery } from "@/api/subject/get-subject";
import { log } from "node:util";
import { useGetClassesQuery } from "@/api/class/get-classess";

interface FilterProps {
  onFilterChange: (filters: any) => void;
}

const subjects = [
  "Mathematics",
  "Science",
  "Language Arts",
  "Social Studies",
  "Foreign Languages",
  "Test Preparation",
  "Music",
  "Computer Science",
];

const syllabus = ["CBSE", "ICSE", "SCERT"];

const MentorFilter: React.FC<FilterProps> = ({ onFilterChange }) => {
  const { data, isLoading, isSuccess, isError, error } = useGetClassesQuery({
    page: 1,
    limit: 100,
  });

  const {
    data: subjectData,
    isLoading: subjectLoading,
    isError: subjectError,
    error: subjectErrorMessage,
  } = useGetSubjectQuery({
    subjectType: "subject",
    page: 1,
    limit: 100,
  });

  

 
  
  const [priceRange, setPriceRange] = React.useState([20, 100]);
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([]);
  const [selectedRating, setSelectedRating] = React.useState<number | null>(
    null
  );

const classess = data?.data?.filter(cls =>
  selectedLevels.length > 0
    ? selectedLevels.some(keyword =>
        cls?.syllabus?.toLowerCase().includes(keyword.toLowerCase())
      )
    : data?.data
) || [];

const classSubjects=classess
const subjects = subjectData?.data|| [];




  

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleLevelChange = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating((prev) => (prev === rating ? null : rating));
  };

  const applyFilters = () => {
    onFilterChange({
      subjects: selectedSubjects,
      levels: selectedLevels,
      priceRange,
      rating: selectedRating,
    });
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedLevels([]);
    setPriceRange([20, 100]);
    setSelectedRating(null);
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg border p-6 w-full lg:w-72">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
        >
          Clear All
        </Button>
      </div>

      <Accordion
        type="multiple"
        
        defaultValue={["syllabus" ]}
      >
        <AccordionItem value="syllabus">
          <AccordionTrigger>Select Syllabus</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {syllabus.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={selectedLevels.includes(level)}
                    onCheckedChange={() => handleLevelChange(level)}
                  />
                  <Label htmlFor={`level-${level}`}>{level}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="class">
          <AccordionTrigger>Class</AccordionTrigger>
          <AccordionContent>
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground">
                Loading class...
              </div>
            ) : isError ? (
              <div className="text-center text-sm text-red-500">
                Error loading class: {error.message}
              </div>
            ) : (
              <div className="space-y-2">
                {classess.map((cls) => (
                  <div key={cls._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${cls._id}`}
                      checked={selectedSubjects.includes(cls._id)}
                      onCheckedChange={() => handleSubjectChange(cls._id)}
                    />
                    <Label
                      className="capitalize"
                      htmlFor={`subject-${cls._id}`}
                    >
                      {cls?.class}{cls?.syllabus ? ` (${cls.syllabus})` : ""}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="subjects">
          <AccordionTrigger>Subjects</AccordionTrigger>
          <AccordionContent>
            {subjectLoading ? (
              <div className="text-center text-sm text-muted-foreground">
                Loading class...
              </div>
            ) : subjectError ? (
              <div className="text-center text-sm text-red-500">
                Error loading class: {subjectErrorMessage.message}
              </div>
            ) : (
              <div className="space-y-2">
                {subjects?.data?.map((subject) => (
                  <div
                    key={subject._id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`subject-${subject._id}`}
                      checked={selectedSubjects.includes(subject._id)}
                      onCheckedChange={() => handleSubjectChange(subject._id)}
                    />
                    <Label
                      className="capitalize"
                      htmlFor={`subject-${subject._id}`}
                    >
                      {subject?.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div>
              <div className="mb-6">
                <Slider 
                  defaultValue={[20, 100]}
                  max={200}
                  min={10}
                  step={5}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mt-6"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>${priceRange[0]}</span>
                <span>to</span>
                <span>${priceRange[1]}+</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem> */}

        {/* <AccordionItem value="rating">
          <AccordionTrigger>Rating</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[5, 4, 3].map((stars) => (
                <div 
                  key={stars} 
                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                    selectedRating === stars ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleRatingChange(stars)}
                >
                  <div className="flex">
                    {Array(stars).fill(0).map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    ))}
                    {Array(5 - stars).fill(0).map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E5E7EB" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    ))}
                    <span className="ml-2">{stars}+ stars</span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem> */}

        {/* <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div>
              <div className="mb-6">
                <Slider 
                  defaultValue={[20, 100]}
                  max={200}
                  min={10}
                  step={5}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mt-6"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>${priceRange[0]}</span>
                <span>to</span>
                <span>${priceRange[1]}+</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem> */}

        {/* <AccordionItem value="rating">
          <AccordionTrigger>Rating</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[5, 4, 3].map((stars) => (
                <div 
                  key={stars} 
                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                    selectedRating === stars ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleRatingChange(stars)}
                >
                  <div className="flex">
                    {Array(stars).fill(0).map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    ))}
                    {Array(5 - stars).fill(0).map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E5E7EB" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    ))}
                    <span className="ml-2">{stars}+ stars</span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem> */}
      </Accordion>

      <Button onClick={applyFilters} className="w-full mt-6">
        Apply Filters
      </Button>
    </div>
  );
};

export default MentorFilter;
