import React, { useState } from "react";
import MainLayout from "@/components/MainLayout";
import MentorCard from "@/components/mentors/MentorCard";
import ResponsiveFilterSection from "@/components/mentors/ResponsiveFilterSection";
import { useGetMentorQuery } from "@/api/mentor/get-mentor";

const MentorListing = () => {
  const { data, isLoading, isError } = useGetMentorQuery({
    page: 1,
    limit: 100000,
    type: "approve",
  });

  const mentorsData = data?.data || [];

  const [filterData, setFilterData] = useState<{
    syllabus: null | string;
    classes: null | string;
    subjects: null | string;
  }>({
    syllabus: null,
    classes: null,
    subjects: null,
  });

  return (
    <MainLayout>
      <div className="container-wide py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Find Your Perfect Mentor
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Browse our curated selection of expert mentors across various
            subjects and education levels. Use the filters to narrow your search
            and find the perfect match for your learning goals.
          </p>
        </div>

        {/* <ResponsiveFilterSection
          filterData={filterData}
          setFilterData={setFilterData}
        /> */}

        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
             {mentorsData &&
  `${mentorsData.filter((mentor) => mentor?.is_first_login === false).length} mentors found`}
            </p>
            {/* <div className="flex items-center gap-2">
              <span className="text-sm">Sort by:</span>
              <select className="text-sm border rounded-md px-2 py-1">
                <option>Rating: High to Low</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Availability</option>
              </select>
            </div> */}
          </div>

          {/* Show loader / error / data / empty state */}
          {isLoading ? (
            <p className="text-center py-16">Loading mentors...</p>
          ) : isError ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold mb-2">Error fetching mentors</h3>
              <p className="text-muted-foreground">
                Please try again later.
              </p>
            </div>
          ) : mentorsData?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentorsData
  ?.filter((mentor) => mentor?.is_first_login === false)
  ?.map((mentor) => (
    <MentorCard
      key={mentor?._id}
      id={mentor?._id}
      name={mentor?.firstName}
      title={mentor?.experience}
      subjects={mentor?.selected_class}
      rating={mentor?.rating}
      hourlyRate={mentor?.hourlyRate}
      image={mentor?.profile_pic}
      availability={mentor?.available_slot}
    />
  ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold mb-2">No mentors available</h3>
              <p className="text-muted-foreground">
                There are no mentors available at this time. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MentorListing;
